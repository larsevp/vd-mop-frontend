/**
 * EntityDetailPane - Detail pane component for Split View mode
 *
 * NOMENCLATURE: Split View - Detail Pane (Right Pane)
 * ====================================================
 *
 * This component is the right pane in SPLIT VIEW MODE.
 *
 * Layout:
 * ├─ Header Section
 * │  ├─ Entity badge and title
 * │  ├─ Edit/Save/Cancel/Delete buttons
 * │  └─ Validation error summary
 * │
 * └─ Content Sections (scrollable)
 *    ├─ Section 1 (e.g., "grunnlag") - collapsible
 *    ├─ Section 2 (e.g., "beskrivelse") - collapsible
 *    ├─ Section 3 (e.g., "implementasjon") - collapsible
 *    └─ ...more sections
 *
 * Features:
 * - View mode: Display fields as read-only content
 * - Edit mode: Display fields as editable form inputs
 * - Collapsible sections with expand/collapse controls
 * - Form validation with error handling
 * - Emne inheritance logic for child entities
 * - Special handling for child tiltak (collapsible single-field sections)
 * - CRUD operations (create, update, delete)
 * - Auto-scroll on entity change
 *
 * Domain-Specific (KravTiltak):
 * - This is a domain-specific renderer passed to EntityWorkspace
 * - Uses modelConfigs for field definitions
 * - Integrates with FieldRenderer for field-level rendering
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Edit, X, Save, RotateCcw, Trash2, Plus, ChevronDown, MoreVertical } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { ValidationErrorSummary, FieldRenderer, FieldSection } from "./components";
import { getEntityTypeConfig } from "../../utils/entityTypeBadges";
import EntityBadge from "../EntityBadge/EntityBadge";
import { TiptapDisplay } from "@/components/ui/editor/TiptapDisplay";
import {
  getVisibleFields,
  getFieldsBySection,
  getFieldRowsBySection,
  initializeFormData,
  validateForm,
  autoExpandErrorSections,
  handleSaveAction,
  handleDeleteAction,
  initializeExpandedSections,
  toggleSection,
  scrollToTop,
  useEmneInheritance  // NEW: Import emne inheritance hook
} from "./helpers";

const EntityDetailPane = ({
  entity,
  modelConfig,
  onSave,
  onDelete,
  onClose,
  onCreateNew,
  entityType = "entity",
  dto,  // NEW: DTO instance for inheritance logic
  kravConfig  // NEW: ModelConfig for krav/prosjektKrav (needed for Tiltak entities)
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const detailViewRef = useRef(null);
  const createMenuRef = useRef(null);
  const lastInitializedEntityId = useRef(null); // Track which entity we initialized sections for
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Configuration
  const modelName = modelConfig?.modelPrintName || entityType;

  // Check if save/delete operations are actually available
  const canSave = useMemo(() => {
    return (onSave && typeof onSave === 'function') || (modelConfig?.updateFn || modelConfig?.createFn);
  }, [onSave, modelConfig?.updateFn, modelConfig?.createFn]);

  const canDelete = useMemo(() => {
    return (onDelete && typeof onDelete === 'function') || modelConfig?.deleteFn;
  }, [onDelete, modelConfig?.deleteFn]);

  // Detect if this is a linked entity creation
  // - created via "Lag tilknyttet tiltak/prosjekttiltak" (has __sourceKrav)
  // - created via "Lag underkrav/underprosjektkrav" (has parentId and is new)
  const isLinkedCreation = useMemo(() => {
    if (entity?.__sourceKrav && entity?.__isNew) {
      return true; // Linked tiltak creation
    }
    if (entity?.parentId && entity?.__isNew) {
      return true; // Child krav creation
    }
    return false;
  }, [entity?.__sourceKrav, entity?.parentId, entity?.__isNew]);

  // Choose appropriate config: use detailFormLinked for linked creation, otherwise use standard detailForm
  const detailFormConfig = useMemo(() => {
    if (isLinkedCreation && modelConfig?.workspace?.detailFormLinked) {
      return modelConfig.workspace.detailFormLinked;
    }
    return modelConfig?.workspace?.detailForm || {};
  }, [isLinkedCreation, modelConfig?.workspace?.detailFormLinked, modelConfig?.workspace?.detailForm]);

  const sections = useMemo(() => {
    return detailFormConfig.sections || { main: { title: "Informasjon", defaultExpanded: true } };
  }, [detailFormConfig.sections]);
  const fieldOverrides = useMemo(() => detailFormConfig.fieldOverrides || {}, [detailFormConfig.fieldOverrides]);
  const workspaceHiddenEdit = useMemo(() => detailFormConfig.workspaceHiddenEdit || [], [detailFormConfig.workspaceHiddenEdit]);
  const workspaceHiddenIndex = useMemo(() => detailFormConfig.workspaceHiddenIndex || [], [detailFormConfig.workspaceHiddenIndex]);
  const hideEmptyFieldsInView = useMemo(() => detailFormConfig.hideEmptyFieldsInView || false, [detailFormConfig.hideEmptyFieldsInView]);
  const collapseEmptySectionsInView = useMemo(() => detailFormConfig.collapseEmptySectionsInView || false, [detailFormConfig.collapseEmptySectionsInView]);
  const autoExpandSectionsWithContent = useMemo(() => detailFormConfig.autoExpandSectionsWithContent !== false, [detailFormConfig.autoExpandSectionsWithContent]); // Default: true
  const allFields = useMemo(() => modelConfig?.fields || [], [modelConfig?.fields]);

  // Get visible fields using helper
  const visibleFields = useMemo(() =>
    getVisibleFields(allFields, fieldOverrides, isEditing, workspaceHiddenEdit, workspaceHiddenIndex, sections),
    [allFields, fieldOverrides, isEditing, workspaceHiddenEdit, workspaceHiddenIndex, sections]
  );

  // Validation function using helper
  const validateFormData = useCallback(() => {
    const newErrors = validateForm(visibleFields, formData, modelName);

    // Manually validate tittel since it's excluded from visibleFields (handled in header)
    const tittelField = allFields.find(f => f.name === 'tittel');
    if (tittelField?.required && (!formData.tittel || formData.tittel.trim() === '')) {
      newErrors.tittel = `${tittelField.label || 'Tittel'} er påkrevet`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [visibleFields, formData, modelName, allFields]);

  // Handle new entity creation
  useEffect(() => {
    if (entity?.__isNew) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [entity?.__isNew]);

  // Initialize form data
  useEffect(() => {
    if (entity) {
      // Create a stable entity key to prevent unnecessary reinitializations
      // For new entities, use a combination of __isNew flag and relationship data
      // For existing entities, use the ID
      const entityKey = entity.__isNew
        ? `new-${entity.krav?.[0] || entity.prosjektKrav?.[0] || 'empty'}`
        : `existing-${entity.id}`;

      // Skip if we've already initialized this exact entity
      if (entityKey === lastInitializedEntityRef.current) {
        return;
      }

      lastInitializedEntityRef.current = entityKey;

      const initialForm = initializeFormData(allFields, entity, modelName, fieldOverrides);

      // For new entities, ensure relationship fields from initial data are included
      if (entity.__isNew) {
        // Include relationship fields that were passed in initial data
        ['krav', 'prosjektKrav'].forEach(relationField => {
          if (entity[relationField] !== undefined) {
            initialForm[relationField] = entity[relationField];
          }
        });
      }

      // Extract IDs from krav/prosjektKrav arrays for inheritance hook
      // Backend returns: krav: [{id: 1}, {id: 2}] (objects)
      // Frontend needs: kravIds: [1, 2] (IDs) for inheritance logic
      if (entity.krav && Array.isArray(entity.krav)) {
        initialForm.kravIds = entity.krav.map(k => k.id || k).filter(Boolean);
      }
      if (entity.prosjektKrav && Array.isArray(entity.prosjektKrav)) {
        initialForm.prosjektKravIds = entity.prosjektKrav.map(k => k.id || k).filter(Boolean);
      }

      // Reset inheritance sync ref when form is reinitialized
      // This ensures inherited values get synced again after form reset
      lastSyncedEmneRef.current = null;

      setFormData(initialForm);
    }
  }, [entity, modelName, allFields]);

  // === EMNE INHERITANCE ===
  // Use the inheritance hook to manage emne inheritance logic
  const inheritanceInfo = useEmneInheritance(formData, dto, entityType, {
    kravConfig,
    modelConfig  // Pass modelConfig for fetching parent data
  });
  const lastSyncedEmneRef = useRef(null);
  const lastInitializedEntityRef = useRef(null);

  // Sync inherited emneId to form (only when editing and inheritance is active)
  useEffect(() => {
    let isMounted = true;

    if (isEditing && inheritanceInfo.isInherited && !inheritanceInfo.isLoading) {
      const inheritedEmne = inheritanceInfo.inheritedEmneId;

      // Always update if inherited value changes, or if we haven't synced this value yet
      // This handles both initial load and form resets
      if (inheritedEmne !== lastSyncedEmneRef.current) {
        lastSyncedEmneRef.current = inheritedEmne;

        if (isMounted) {
          setFormData(prev => {
            // Only update if the current value is different from inherited
            // Use loose equality to handle null/undefined/empty string
            if (prev.emneId != inheritedEmne) {
              return {
                ...prev,
                emneId: inheritedEmne
              };
            }
            return prev;
          });
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [
    isEditing,
    inheritanceInfo.isInherited,
    inheritanceInfo.inheritedEmneId,
    inheritanceInfo.isLoading,
  ]);

  // Initialize expanded sections based on config and data
  // Only run when entity changes or edit mode changes, NOT on every formData change
  useEffect(() => {
    // Early return if no entity
    if (!entity) {
      return;
    }

    const currentEntityId = `${entity?.id}`;
    const previousEntityId = lastInitializedEntityId.current?.split('-')[0];
    const entityChanged = currentEntityId !== previousEntityId;

    // Skip if we've already initialized for this entity and edit mode hasn't changed
    const entityKey = `${entity?.id}-${isEditing}`;
    if (lastInitializedEntityId.current === entityKey) {
      return;
    }
    lastInitializedEntityId.current = entityKey;

    // If only edit mode changed (not entity), preserve current expanded state
    if (!entityChanged && previousEntityId) {
      // Keep existing expanded sections when toggling edit mode
      return;
    }

    // Entity changed - initialize based on mode
    let expandedSet;

    if (isEditing) {
      // In edit mode: Use default expansion from config
      expandedSet = initializeExpandedSections(sections);
    } else {
      // In view mode: Smart expansion based on content and config
      expandedSet = new Set();

      Object.keys(sections).forEach(sectionName => {
        const section = sections[sectionName];
        const sectionFields = getFieldsBySection(visibleFields)[sectionName] || [];

        // Check if section has any filled fields
        const hasFilledFields = sectionFields.some(field => {
          const value = formData[field.name];
          const isEmpty = value === null || value === undefined || value === '' ||
                         (Array.isArray(value) && value.length === 0) ||
                         (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
          return !isEmpty;
        });

        // Expansion logic for view mode:
        let shouldExpand = false;

        if (section.defaultExpanded === true) {
          // Always expand if defaultExpanded: true
          shouldExpand = true;
        } else if (autoExpandSectionsWithContent && hasFilledFields) {
          // Auto-expand sections with content (if feature enabled)
          shouldExpand = true;
        } else if (!autoExpandSectionsWithContent && section.defaultExpanded !== false) {
          // Fallback to default expansion if auto-expand is disabled
          shouldExpand = true;
        }

        if (shouldExpand) {
          expandedSet.add(sectionName);
        }
      });
    }

    // Apply special handling for child tiltak beskrivelse (applies to BOTH edit and view mode)
    const isChildTiltak = entity && (entity.parentId || entity._relatedToKrav) &&
                          entity.entityType?.toLowerCase().includes('tiltak');

    if (isChildTiltak) {
      // Check 'beskrivelse' and 'info' sections
      ['beskrivelse', 'info'].forEach(sectionName => {
        if (!sections[sectionName]) return;

        const sectionFields = getFieldsBySection(visibleFields)[sectionName] || [];
        const hasFilledFields = sectionFields.some(field => {
          // Check entity data directly (formData might not be initialized yet)
          const value = entity[field.name];
          const isEmpty = value === null || value === undefined || value === '' ||
                         (Array.isArray(value) && value.length === 0) ||
                         (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
          return !isEmpty;
        });

        // Only expand if it has content, otherwise remove from expanded set
        if (hasFilledFields) {
          expandedSet.add(sectionName);
        } else {
          expandedSet.delete(sectionName);
        }
      });
    }

    setExpandedSections(expandedSet);
  }, [entity?.id, isEditing, collapseEmptySectionsInView]); // Only re-run when entity or edit mode changes

  // Auto-expand error sections
  useEffect(() => {
    autoExpandErrorSections(errors, visibleFields, setExpandedSections);
  }, [errors, visibleFields]);

  // Scroll to top when entity changes (new entity selected)
  useEffect(() => {
    scrollToTop(detailViewRef);
  }, [entity?.id]);

  // Close create menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if clicking on a menu item - don't close yet, let the onClick fire
      const isMenuItem = event.target.closest('[role="menuitem"]');
      if (isMenuItem) {
        return;
      }

      if (createMenuRef.current && !createMenuRef.current.contains(event.target)) {
        setIsCreateMenuOpen(false);
      }
    };

    if (isCreateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCreateMenuOpen]);

  // Field change handler
  const handleFieldChange = useCallback((fieldNameOrEvent, value) => {
    let fieldName, fieldValue;

    if (typeof fieldNameOrEvent === "string") {
      fieldName = fieldNameOrEvent;
      fieldValue = value;
    } else if (fieldNameOrEvent?.target) {
      fieldName = fieldNameOrEvent.target.name;
      fieldValue = fieldNameOrEvent.target.value;
    } else {
      return;
    }

    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));

    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  }, [errors]);

  // Create save handler from modelConfig if onSave is not provided or is null
  const createSaveHandler = useCallback(async (saveData, isUpdate) => {
    let result;
    
    if (onSave && typeof onSave === 'function') {
      // Use provided onSave if available
      result = await onSave(saveData, isUpdate);
    } else if (modelConfig) {
      // Create save handler from modelConfig
      if (isUpdate && modelConfig.updateFn) {
        result = await modelConfig.updateFn(saveData.id, saveData);
      } else if (!isUpdate && modelConfig.createFn) {
        result = await modelConfig.createFn(saveData);
      } else {
        throw new Error(`${isUpdate ? 'Update' : 'Create'} function not available in modelConfig`);
      }

      // Invalidate relevant query caches to refresh data
      await queryClient.invalidateQueries({
        queryKey: ['entities']
      });

      // Invalidate inheritance-related caches to ensure emne inheritance data is fresh
      await queryClient.invalidateQueries({
        queryKey: ['parent']
      });
      await queryClient.invalidateQueries({
        queryKey: ['krav']
      });
    } else {
      throw new Error('No save handler available');
    }
    
    return result;
  }, [onSave, modelConfig, queryClient]);

  // Save handler using helper
  const handleSave = useCallback(async () => {
    const result = await handleSaveAction(validateFormData, formData, entity, createSaveHandler, setIsSubmitting, setIsEditing);
    // Only set backend validation errors (not empty objects from client validation failures)
    if (!result.success && result.errors && Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
    }
  }, [validateFormData, formData, entity, createSaveHandler]);

  // Create delete handler from modelConfig if onDelete is not provided or is null
  const createDeleteHandler = useCallback(async (entityToDelete) => {
    let result;
    
    if (onDelete && typeof onDelete === 'function') {
      // Use provided onDelete if available
      result = await onDelete(entityToDelete);
    } else if (modelConfig && modelConfig.deleteFn) {
      // Create delete handler from modelConfig
      result = await modelConfig.deleteFn(entityToDelete.id, entityToDelete);

      // Invalidate relevant query caches to refresh data
      await queryClient.invalidateQueries({
        queryKey: ['entities']
      });

      // Invalidate inheritance-related caches to ensure emne inheritance data is fresh
      await queryClient.invalidateQueries({
        queryKey: ['parent']
      });
      await queryClient.invalidateQueries({
        queryKey: ['krav']
      });
    } else {
      throw new Error('Delete function not available');
    }
    
    return result;
  }, [onDelete, modelConfig, queryClient]);

  // Delete handler using helper
  const handleDelete = useCallback(async () => {
    await handleDeleteAction(entity, createDeleteHandler);
  }, [entity, createDeleteHandler]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    const isNewEntity = entity?.__isNew;
    
    if (isNewEntity && onClose) {
      // For new entities, close the detail pane
      onClose();
    } else {
      // For existing entities, just exit edit mode and reset form
      setIsEditing(false);
      setErrors({});
      if (entity) {
        const resetForm = initializeFormData(allFields, entity, modelName, fieldOverrides);
        setFormData(resetForm);
      }
    }
  }, [entity, allFields, modelName, onClose]);

  // Toggle section using helper
  const handleToggleSection = useCallback((sectionName) => {
    toggleSection(sectionName, setExpandedSections);
  }, []);

  // Keyboard shortcuts - create stable refs for handlers
  const handleCancelRef = useRef();
  const handleSaveRef = useRef();

  // Update refs when functions change
  useEffect(() => {
    handleCancelRef.current = handleCancel;
    handleSaveRef.current = handleSave;
  });

  // Keyboard shortcuts with stable listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if the event is coming from a ComboBox - don't interfere
      const isWithinComboBox = e.target.closest('[role="combobox"]') ||
                               e.target.closest('[role="listbox"]') ||
                               e.target.closest('[role="option"]');

      if (isWithinComboBox) {
        return; // Let ComboBox handle its own keyboard events
      }

      if (e.key === 'e' && !isEditing && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        if (handleCancelRef.current) {
          handleCancelRef.current();
        }
      } else if (e.key === 'Enter' && e.ctrlKey && isEditing) {
        e.preventDefault();
        if (handleSaveRef.current) {
          handleSaveRef.current();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]); // Only depend on isEditing state

  // Handle creating connected tiltak from krav - MUST be before early returns
  const handleCreateConnectedTiltak = useCallback(() => {
    if (!onCreateNew || !entity) {
      return;
    }

    // Get entity type for badge (from entity or fallback to entityType prop)
    const currentEntityType = entity?.entityType || entity?.__entityType || entityType;

    // Support both krav -> tiltak and prosjektkrav -> prosjekttiltak
    let targetEntityType, relationshipField, relationshipValue;

    const entityTypeLower = currentEntityType.toLowerCase();

    if (entityTypeLower === 'krav') {
      targetEntityType = 'tiltak';
      relationshipField = 'krav';
      relationshipValue = { krav: [entity.id] }; // Backend expects 'krav' array of IDs
    } else if (entityTypeLower === 'prosjektkrav') {
      targetEntityType = 'prosjekttiltak';
      relationshipField = 'prosjektKrav';
      relationshipValue = { prosjektKrav: [entity.id] }; // Backend expects 'prosjektKrav' array of IDs
    } else {
      return; // Not a supported entity type
    }

    const initialData = {
      tittel: `Tiltak ${entity.tittel}`, // Add "Tiltak " prefix to the copied krav title
      ...relationshipValue, // Set the connected relationship
      // Add source krav context for UI display
      __sourceKrav: {
        id: entity.id,
        tittel: entity.tittel,
        beskrivelse: entity.beskrivelse,
        beskrivelseSnippet: entity.beskrivelseSnippet,
        entityType: currentEntityType
      }
    };

    onCreateNew(targetEntityType, initialData);
  }, [onCreateNew, entity, entityType]);

  // Handle creating child krav from parent krav
  const handleCreateChildKrav = useCallback(() => {
    if (!onCreateNew || !entity) {
      return;
    }

    // Get entity type for badge (from entity or fallback to entityType prop)
    const currentEntityType = entity?.entityType || entity?.__entityType || entityType;
    const entityTypeLower = currentEntityType.toLowerCase();

    // Only support creating child krav from krav or prosjektkrav
    if (entityTypeLower !== 'krav' && entityTypeLower !== 'prosjektkrav') {
      return;
    }

    const initialData = {
      tittel: '', // Empty title for user to fill in
      parentId: entity.id, // Set parent relationship
      // Copy project context if this is a prosjektkrav
      ...(entityTypeLower === 'prosjektkrav' && entity.projectId ? { projectId: entity.projectId } : {})
    };

    onCreateNew(currentEntityType, initialData);
  }, [onCreateNew, entity, entityType]);

  // IMPORTANT: Early return AFTER all hooks to avoid hook consistency errors
  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Ingen element valgt</p>
      </div>
    );
  }

  // IMPORTANT: For consistent hook patterns, ensure modelConfig is always defined
  if (!modelConfig) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Laster...</p>
      </div>
    );
  }

  // Entity display info
  const isNewEntity = entity?.__isNew;
  const entityTitle = isNewEntity
    ? `Ny ${modelName}`
    : (entity.tittel || entity.navn || `${entityType} ${entity.id}`);
  const entityUID = isNewEntity ? null : (entity.kravUID || entity.tiltakUID || entity.uid);
  const emneTitle = isNewEntity ? null : (entity.emne?.navn || entity.emneTittel);

  // Get entity type for badge (from entity or fallback to entityType prop)
  const currentEntityType = entity?.entityType || entity?.__entityType || entityType;
  const entityConfig = getEntityTypeConfig(currentEntityType);


  // Ref for measuring header height
  const headerRef = React.useRef(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);

  // Measure header height on mount and when it changes
  React.useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      if (height !== headerHeight) {
        setHeaderHeight(height);
      }
    }
  }, [isEditing, errors, headerHeight]); // Re-measure when editing state or errors change

  return (
    <div className="relative h-full bg-white">
      {/* Header - Scandinavian Clean Design - Absolutely positioned with 2px offset */}
      <div
        ref={headerRef}
        className={`absolute left-0 right-0 z-20 border-b px-4 sm:px-8 py-4 sm:py-6 transition-all duration-200 ${isEditing ? "bg-slate-50 border-slate-200" : "bg-white border-gray-200"}`}
        style={{ top: '2px' }}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Badge + Emne + Title */}
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
            {!isNewEntity && (
              <EntityBadge
                uid={entityUID}
                badgeColor={entityConfig.badgeColor}
                badgeText={entityConfig.shortLabel}
                size="md"
              />
            )}
            {emneTitle && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                {emneTitle}
              </span>
            )}

            {isEditing ? (
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={formData.tittel || ""}
                  onChange={(e) => handleFieldChange("tittel", e.target.value)}
                  className={`text-lg sm:text-2xl font-light leading-tight w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:ring-2 focus:border-transparent transition-all ${
                    errors.tittel
                      ? 'border-red-300 text-red-900 focus:ring-red-400 bg-red-50'
                      : 'text-gray-900 border-gray-300 focus:ring-slate-400 focus:border-slate-400 bg-white'
                  }`}
                  placeholder="Tittel..."
                />
                {errors.tittel && (
                  <p className="mt-2 text-sm text-red-600 font-normal">{errors.tittel}</p>
                )}
              </div>
            ) : (
              <h2 className="text-lg sm:text-2xl font-light text-gray-900 truncate flex-1 min-w-0">
                {entityTitle}
              </h2>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isEditing ? (
              <>
                {/* Desktop: Individual buttons */}
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  tabIndex={-1}
                  className="hidden lg:inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Lagrer...' : 'Lagre'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  tabIndex={-1}
                  className="hidden lg:inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Avbryt
                </button>

                {/* Mobile/Tablet: Menu */}
                <div className="lg:hidden relative" ref={createMenuRef}>
                  <button
                    onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                    title="Handlinger"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isCreateMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu">
                        <button
                          onClick={() => {
                            handleSave();
                            setIsCreateMenuOpen(false);
                          }}
                          disabled={isSubmitting}
                          className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSubmitting ? 'Lagrer...' : 'Lagre'}
                        </button>
                        <button
                          onClick={() => {
                            handleCancel();
                            setIsCreateMenuOpen(false);
                          }}
                          disabled={isSubmitting}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Desktop: Individual buttons */}
                {onCreateNew && (currentEntityType.toLowerCase() === 'krav' || currentEntityType.toLowerCase() === 'prosjektkrav') && !isNewEntity && (
                  <div className="hidden lg:block relative" ref={createMenuRef}>
                    <button
                      onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                      className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ny
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>

                    {isCreateMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu">
                          {!entity?.parentId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateChildKrav();
                                setIsCreateMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                              role="menuitem"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Tilknyttet krav
                            </button>
                          )}
                          {entityType.toLowerCase().includes('combined') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateConnectedTiltak();
                                setIsCreateMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                              role="menuitem"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Tilknyttet tiltak
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {canSave && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="hidden lg:inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Rediger
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="hidden lg:inline-flex items-center px-4 py-2.5 border border-red-200 text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett
                  </button>
                )}

                {/* Mobile/Tablet: Menu */}
                {!isNewEntity && (
                  <div className="lg:hidden relative" ref={createMenuRef}>
                    <button
                      onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                      className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                      title="Handlinger"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isCreateMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu">
                          {canSave && (
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setIsCreateMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                              role="menuitem"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Rediger
                            </button>
                          )}
                          {onCreateNew && (currentEntityType.toLowerCase() === 'krav' || currentEntityType.toLowerCase() === 'prosjektkrav') && (
                            <>
                              {!entity?.parentId && (
                                <button
                                  onClick={() => {
                                    handleCreateChildKrav();
                                    setIsCreateMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                                  role="menuitem"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Tilknyttet krav
                                </button>
                              )}
                              {entityType.toLowerCase().includes('combined') && (
                                <button
                                  onClick={() => {
                                    handleCreateConnectedTiltak();
                                    setIsCreateMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                                  role="menuitem"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Tilknyttet tiltak
                                </button>
                              )}
                            </>
                          )}
                          {canDelete && (
                            <>
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => {
                                  handleDelete();
                                  setIsCreateMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                                role="menuitem"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Slett
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Keyboard hints */}
        {isEditing && (
          <div className="hidden lg:block mt-4 text-xs text-slate-600 font-normal">Redigeringsmodus - trykk Enter for å lagre eller Esc for å avbryte</div>
        )}
        {!isEditing && (
          <div className="hidden lg:block mt-4 text-xs text-gray-500 font-normal">Trykk E for å redigere</div>
        )}
      </div>

      {/* Content - Increased spacing for Nordic minimalism - Absolutely positioned below header */}
      <div
        ref={detailViewRef}
        className="absolute left-0 right-0 bottom-0 overflow-y-scroll px-4 sm:px-8 py-6 sm:py-8"
        style={{ top: `${headerHeight + 2}px`, overscrollBehavior: 'contain' }}
      >
        <ValidationErrorSummary errors={errors} fields={allFields} />

        {/* Source Krav Context Box - Clean Scandinavian card */}
        {entity?.__sourceKrav && (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                  <span className="text-slate-700 text-sm font-medium">
                    {entity.__sourceKrav.entityType === 'prosjektkrav' ? 'PK' : 'K'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Tilknyttet {entity.__sourceKrav.entityType === 'prosjektkrav' ? 'prosjektkrav' : 'krav'}: {entity.__sourceKrav.tittel}
                </div>
                {entity.__sourceKrav.beskrivelse && (
                  <div className="text-sm text-gray-600 mt-3">
                    <TiptapDisplay
                      content={entity.__sourceKrav.beskrivelse}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {Object.entries(sections).map(([sectionName, sectionInfo]) => {
            const sectionFields = getFieldsBySection(visibleFields)[sectionName] || [];
            if (sectionFields.length === 0) return null;

            const isExpanded = expandedSections.has(sectionName);
            const isMainInfoSection = sectionName === "info" || sectionName === "main";
            const { rowGroups, noRowFields } = getFieldRowsBySection(sectionFields);

            // Helper to check if a value is empty
            const isEmptyValue = (value) => {
              return value === null || value === undefined || value === '' ||
                     (Array.isArray(value) && value.length === 0) ||
                     (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
            };

            // Filter fields based on hideEmptyFieldsInView setting
            const filterEmptyFields = (fields) => {
              if (!hideEmptyFieldsInView || isEditing) {
                return fields; // Show all fields in edit mode or if feature is disabled
              }
              return fields.filter(field => !isEmptyValue(formData[field.name]));
            };

            // Create a unified list of items (fields and rows) with their order
            const items = [];

            // Add individual fields (filtered for empty values in view mode)
            const filteredNoRowFields = filterEmptyFields(noRowFields);
            filteredNoRowFields.forEach(field => {
              items.push({
                type: 'field',
                order: field.detailOrder || 0,
                content: field
              });
            });

            // Add rows (filtered for empty values in view mode)
            Object.entries(rowGroups).forEach(([rowName, rowFields]) => {
              const filteredRowFields = filterEmptyFields(rowFields);
              // Only add row if it has at least one non-empty field
              if (filteredRowFields.length > 0) {
                const minOrder = Math.min(...filteredRowFields.map(f => f.detailOrder || 0));
                items.push({
                  type: 'row',
                  order: minOrder,
                  rowName,
                  content: filteredRowFields
                });
              }
            });

            // Sort all items by order
            items.sort((a, b) => a.order - b.order);

            // If hideEmptyFieldsInView is enabled and we're in view mode, skip empty sections
            if (hideEmptyFieldsInView && !isEditing && items.length === 0) {
              return null;
            }

            // Check if section has any filled fields (for collapseEmptySectionsInView)
            const sectionHasFilledFields = items.length > 0 && items.some(item => {
              if (item.type === 'field') {
                return !isEmptyValue(formData[item.content.name]);
              } else {
                // For rows, check if any field in the row has a value
                return item.content.some(field => !isEmptyValue(formData[field.name]));
              }
            });

            // Determine if section should be expanded
            // ALWAYS respect user toggle (isExpanded)
            // collapseEmptySectionsInView only affects INITIAL state when entity loads
            const shouldBeExpanded = isExpanded;

            const fieldContent = (
              <div className="space-y-6">
                {items.map((item, index) => {
                  if (item.type === 'field') {
                    const field = item.content;
                    return (
                      <FieldRenderer
                        key={field.name}
                        field={field}
                        value={formData[field.name] ?? ""}
                        onChange={handleFieldChange}
                        error={errors[field.name]}
                        form={formData}
                        entity={entity}
                        modelName={modelName}
                        isEditing={isEditing}
                        inheritanceInfo={inheritanceInfo}
                      />
                    );
                  } else {
                    // Render row with improved spacing and progressive collapse
                    const rowFields = item.content;
                    const fieldCount = rowFields.length;
                    // Determine grid columns based on number of fields
                    // Progressive collapse: Desktop → Tablet (2 cols) → Mobile (1 col)
                    const gridClass = fieldCount === 1
                      ? "grid grid-cols-1 gap-6"
                      : fieldCount === 2
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                      : fieldCount === 3
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"  // 3 → 2 → 1
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";  // 4 → 2 → 1

                    return (
                      <div key={item.rowName} className={gridClass}>
                        {rowFields
                          .sort((a, b) => (a.detailOrder || 0) - (b.detailOrder || 0))
                          .map(field => (
                            <div key={field.name}>
                              <FieldRenderer
                                field={field}
                                value={formData[field.name] ?? ""}
                                onChange={handleFieldChange}
                                error={errors[field.name]}
                                form={formData}
                                entity={entity}
                                modelName={modelName}
                                isEditing={isEditing}
                                inheritanceInfo={inheritanceInfo}
                              />
                            </div>
                          ))
                        }
                      </div>
                    );
                  }
                })}
              </div>
            );

            // Check if this is a child tiltak with single field in beskrivelse section
            const isChildTiltak = entity && (entity.parentId || entity._relatedToKrav) &&
                                  entity.entityType?.toLowerCase().includes('tiltak');
            const isSingleFieldBeskrivelseSection = isChildTiltak &&
                                                     sectionName === 'beskrivelse' &&
                                                     items.length === 1 &&
                                                     items[0].type === 'field';

            // For child tiltak beskrivelse with single field: render field directly with collapsible label
            if (isSingleFieldBeskrivelseSection) {
              const field = items[0].content;
              const fieldValue = formData[field.name];
              const isEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '' ||
                             (Array.isArray(fieldValue) && fieldValue.length === 0) ||
                             (typeof fieldValue === 'object' && !Array.isArray(fieldValue) && Object.keys(fieldValue).length === 0);

              // Don't render at all if empty and not editing
              if (!isEditing && isEmpty) {
                return null;
              }

              return (
                <div key={sectionName} className="space-y-6 pl-7">
                  <FieldRenderer
                    field={field}
                    value={formData[field.name] ?? ""}
                    onChange={handleFieldChange}
                    error={errors[field.name]}
                    form={formData}
                    entity={entity}
                    modelName={modelName}
                    isEditing={isEditing}
                    inheritanceInfo={inheritanceInfo}
                    isCollapsible={true}
                    isExpanded={shouldBeExpanded}
                    onToggle={() => handleToggleSection(sectionName)}
                  />
                </div>
              );
            }

            // Show all sections with their collapsible headers for visual structure
            return (
              <div key={sectionName}>
                <FieldSection
                  title={sectionInfo.title}
                  isExpanded={shouldBeExpanded}
                  onToggle={() => handleToggleSection(sectionName)}
                  noTitle={sectionInfo.noTitle || isMainInfoSection}
                  isMainSection={isMainInfoSection}
                  isEditing={isEditing}
                >
                  {fieldContent}
                </FieldSection>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Memoize EntityDetailPane to prevent re-renders when props haven't changed
// This is especially important since the component has many internal state updates
// Only re-render if entity, modelConfig, or dto change (onSave, onDelete, onClose callbacks are intentionally excluded)
export default React.memo(EntityDetailPane, (prevProps, nextProps) => {
  return (
    prevProps.entity === nextProps.entity &&
    prevProps.modelConfig === nextProps.modelConfig &&
    prevProps.dto === nextProps.dto &&
    prevProps.entityType === nextProps.entityType &&
    prevProps.kravConfig === nextProps.kravConfig
    // Note: We intentionally don't compare callback props (onSave, onDelete, onClose, onCreateNew)
    // to avoid re-renders from function reference changes
  );
});