import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Edit, Trash2, Copy, FileCheck, Wrench, ArrowRight } from 'lucide-react';
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";

// Import helpers
import { truncateText, getEntityTitle, formatCardText } from './helpers/textHelpers';
import { getIcon } from './helpers/iconHelpers.jsx';
import { getStatusDisplay, getVurderingDisplay, getPrioritetDisplay } from '../../utils/statusHelpers';
import { getSpecialReference, getParentReference } from './helpers/referenceHelpers.jsx';

// Import components
import StatusIndicator from '../StatusIndicator';
import EntityBadge from '../EntityBadge/EntityBadge';
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver";
import { getModelConfig } from '@/modelConfigs';
import { useEntityForm } from '../EntityDetailPane/helpers';

/**
 * EntityCard - Shared card component for all KravTiltak entities
 * 
 * Features two distinct layouts:
 * - Cards Mode: Magazine-style layout with full rich text content
 * - Split Mode: Compact table-like layout with truncated content
 * 
 * This component handles krav, tiltak, prosjektKrav, and prosjektTiltak
 * through a configuration object that defines entity-specific behavior.
 */
const EntityCard = ({
  entity,
  isSelected = false,
  onClick = () => {},
  onDoubleClick = () => {},
  viewOptions = {},
  config = {},
  onFieldSave,
  editingDisabled = false,
  editMode = false,
  compactMode = false, // New prop for compact text sizing
  'data-entity-id': dataEntityId,
  // Multi-select props
  selectionMode = 'single', // 'single' | 'multi'
  isItemSelected = false, // Is this specific item selected in multi-select mode
  onToggleSelection = () => {}, // Callback for toggling selection
  // Copy to project handler (for read-only mode)
  onCopyToProject = null,
  ...restProps
}) => {
  // Helper to map backend entityType to modelConfig key
  const getModelConfigKey = (entityType) => {
    if (!entityType) return null;
    
    // Map backend lowercase types to modelConfig camelCase keys
    const entityTypeMap = {
      'prosjektkrav': 'prosjektKrav',
      'prosjekttiltak': 'prosjektTiltak',
      'krav': 'krav',
      'tiltak': 'tiltak',
      'prosjekt': 'prosjekt',
      'emne': 'emne',
      'files': 'files',
      'users': 'users',
      'enheter': 'enheter',
      'status': 'status',
      'vurderinger': 'vurdering'
    };
    
    const lowercaseType = entityType.toLowerCase();
    return entityTypeMap[lowercaseType] || entityType;
  };

  // Get model configuration for form management
  let modelConfig = null;
  try {
    const modelConfigKey = getModelConfigKey(entity?.entityType);
    modelConfig = modelConfigKey ? getModelConfig(modelConfigKey) : null;
  } catch (error) {
    console.warn("EntityCard: Failed to get model config for entity type:", entity?.entityType, error);
    // Continue with null modelConfig - the component should still render
  }
  const allFields = modelConfig?.fields || [];
  const modelName = modelConfig?.modelPrintName || entity?.entityType || 'entity';

  // Get article view configuration from modelConfig
  const articleViewConfig = modelConfig?.workspaceConfig?.workspace?.articleView || {
    mainContentFields: ['beskrivelse', 'informasjon'],
    merknadField: 'merknader',
    statusFields: ['vurderingId', 'statusId', 'prioritet', 'obligatorisk'],
  };

  // Use shared form hook when inline editing is active
  const { formData, handleFieldChange } = useEntityForm(
    editMode && onFieldSave ? entity : null,
    allFields,
    modelName
  );

  const handleClick = (event) => {
    // Don't handle clicks on form inputs and interactive elements
    const target = event.target;
    const interactiveElements = ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'];
    const isInteractiveElement = interactiveElements.includes(target.tagName);
    const isInsideSelect = target.closest('[role="combobox"], [role="listbox"], [data-radix-select-trigger], [data-radix-select-content]');
    const isInsideRadixSelect = target.closest('[data-radix-collection-item], [data-state], .obligatorisk-field');

    // Check if click is on checkbox - handle differently
    const isCheckbox = target.type === 'checkbox' || target.closest('[data-multi-select-checkbox]');

    // Also check if the click originated from our action buttons specifically
    const isActionButton = target.closest('button[title="Rediger (trykk E)"], button[title="Slett"]');

    // Don't handle click if it's on an interactive element (except checkbox which is handled separately)
    if (!isCheckbox && (isInteractiveElement || isInsideSelect || isInsideRadixSelect || isActionButton)) {
      return;
    }

    // In multi-select mode, clicking the card (or checkbox) toggles selection
    if (selectionMode === 'multi') {
      event.stopPropagation();
      // Pass entity metadata for combined views (needed for bulk delete)
      onToggleSelection(entity.id, {
        entityType: entity.entityType,
        renderId: entity.renderId
      });
      return;
    }

    // In single-select mode, just select the card
    onClick(entity, 'select');
  };

  const handleDoubleClick = () => {
    // In cards mode, double-click enters edit mode (same as Rediger button)
    if (isExpandedCards) {
      onClick(entity, 'editCard');
    } else {
      // In split mode, double-click opens detail pane
      onDoubleClick(entity);
    }
  };

  // Get computed values
  const title = getEntityTitle(entity, config);
  const uid = entity[config.uidField] || entity.uid;
  const isExpandedCards = viewOptions.viewMode === 'cards';
  const shouldUseCompactMode = compactMode || !isExpandedCards; // Use compact mode for row list
  const shouldIndent = entity.parentId || entity._relatedToKrav;

  /**
   * Get description content based on view mode
   * Uses DisplayValueResolver for rich text in cards mode
   */
  const getDescription = () => {
    if (isExpandedCards) {
      // For cards mode, show full content - no snippets
      if (entity.beskrivelse) {
        return DisplayValueResolver.getDisplayComponent(
          entity,
          { name: 'beskrivelse', type: 'basicrichtext' },
          'DETAIL',
          entity.entityType
        );
      }
      return null;
    } else {
      // Use snippet for compact split view - plain text
      return entity.beskrivelseSnippet || entity.descriptionSnippet || '';
    }
  };

  /**
   * Helper functions for inline editing
   */
  const getFieldConfig = (fieldName) => {
    if (!entity.entityType || !modelConfig) return null;
    try {
      return modelConfig.fields.find(field => field.name === fieldName);
    } catch (error) {
      console.warn("EntityCard: Failed to get field config for field:", fieldName, error);
      return null;
    }
  };

  // Use merknad field from article config
  const merknadFieldName = articleViewConfig.merknadField;
  const merknadValue = entity[merknadFieldName];

  // Debounced save for text fields
  const saveTimeoutRef = useRef(null);
  const debouncedSave = useCallback((fieldName, value, entity) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      onFieldSave(fieldName, value, entity);
    }, 1500); // Save after 1.5 seconds of no typing
  }, [onFieldSave]);

  // Immediate save (for blur events and non-text fields)
  const immediateSave = useCallback((fieldName, value, entity) => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onFieldSave(fieldName, value, entity);
  }, [onFieldSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut handling - "e" for edit when selected
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyPress = (event) => {
      const activeElement = document.activeElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName) ||
                            activeElement?.contentEditable === 'true';
      const isTextareaFocused = activeElement?.tagName === 'TEXTAREA';

      // Handle Enter key for single-line inputs in edit mode
      if (event.key === 'Enter' && editMode && viewOptions?.viewMode === 'cards' && isInputFocused && !isTextareaFocused) {
        event.preventDefault();
        onClick(entity, 'select'); // Exit edit mode with Enter
        return;
      }

      // Handle Escape key in edit mode (works regardless of focus)
      if (event.key === 'Escape' && editMode && viewOptions?.viewMode === 'cards') {
        event.preventDefault();
        onClick(entity, 'select'); // Exit edit mode with ESC
        return;
      }

      // For other keys, only handle if no input/textarea is focused and no modifiers are pressed
      if (isInputFocused || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        if (viewOptions?.viewMode === 'cards') {
          // Toggle edit mode in cards view
          if (editMode) {
            onClick(entity, 'select'); // Exit edit mode
          } else {
            onClick(entity, 'editCard'); // Enter edit mode
          }
        } else {
          // In split mode, always use 'edit' action (opens detail pane)
          onClick(entity, 'edit');
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isSelected, onClick, entity]);

  // Click outside handler - deselect card when clicking outside
  const cardRef = useRef(null);
  useEffect(() => {
    if (!isSelected || !isExpandedCards) return;

    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        // Click is outside the card, deselect it (which also exits edit mode if active)
        onClick(null, 'deselect');
      }
    };

    // Add a small delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelected, isExpandedCards, onClick]);

  const renderStatusField = (fieldName, displayFn, label) => {
    const display = displayFn(entity);
    // Show field if it's in edit mode and editable, even if no current value
    const shouldShowField = display || (editMode && onFieldSave && !editingDisabled);
    if (!shouldShowField) return null;

    // When in edit mode and onFieldSave is available, render the form field
    if (editMode && onFieldSave && !editingDisabled) {
      const fieldConfig = getFieldConfig(fieldName);
      if (fieldConfig) {
        const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, entity.entityType);

        return (
          <div
            className="flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</span>
            <div className="flex-1">
              <FieldComponent
                field={fieldConfig}
                value={formData[fieldName] ?? entity[fieldName] ?? ""}
                onChange={(eventOrValue) => {
                  // Update form data immediately (same pattern as detail view)
                  handleFieldChange(eventOrValue);

                  // Extract actual value and save to server
                  let actualValue;
                  if (typeof eventOrValue === "object" && eventOrValue?.target) {
                    actualValue = eventOrValue.target.value;
                  } else {
                    actualValue = eventOrValue;
                  }

                  onFieldSave(fieldName, actualValue, entity);
                }}
                className="text-xs"
                error={null}
              />
            </div>
          </div>
        );
      }
    }

    // Default display mode - handle case where display might be null
    if (!display) {
      // Show "Not set" or similar for fields without values
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</span>
          <span className="text-slate-400 text-xs">Ikke satt</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <div style={{ color: display.color }}>
            {getIcon(display.icon, 14)}
          </div>
          <span className="text-slate-900 text-sm font-medium">{display.text}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      id={`entity-card-${entity.id}`}
      ref={cardRef}
      data-entity-id={dataEntityId}
      className={`
        relative cursor-pointer
        ${isExpandedCards
          ? `max-w-5xl mx-auto py-4 px-8 transition-all duration-200 ${isSelected ? '' : 'hover:bg-slate-50/20'}`
          : `block w-full mb-1 px-4 py-3 rounded-md transition-colors duration-150 ${
              isSelected
                ? 'bg-slate-50 border-l-2 border-l-slate-400'
                : (selectionMode === 'multi' && isItemSelected)
                  ? 'bg-primary/5 border-l-2 border-l-primary'
                  : 'hover:bg-slate-50/60 border-l-2 border-l-transparent'
            } ${shouldIndent ? 'relative' : ''}`
        }
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >

      <div className={isExpandedCards ? '' : (shouldIndent ? 'ml-8' : '')}>
        {isExpandedCards ? (
          /* 📰 ARTICLE MODE - Clean editorial layout */
        <article className={`space-y-3 transition-all duration-200 ${isSelected ? (editMode ? 'border-2 border-slate-300 p-6 rounded-xl -mx-8 -my-4' : 'bg-slate-50 p-6 rounded-xl -mx-8 -my-4') : ''}`}>
          {/* Article Header */}
          <header className="space-y-2">
            {/* Title with Icon (One Line) */}
            <div className="flex items-center justify-between gap-4">
              {/* Left: Icon + UID + Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Entity Type Icon with tree lines for children */}
                {(() => {
                  // Determine if this is a krav or tiltak entity
                  const isKrav = entity.entityType?.toLowerCase().includes('krav');
                  const isTiltak = entity.entityType?.toLowerCase().includes('tiltak');
                  // Hierarchical child (has parentId)
                  const isHierarchicalChild = entity.parentId;
                  // Related item (tiltak connected to krav)
                  const isRelated = entity._relatedToKrav;
                  const isChild = isHierarchicalChild || isRelated;

                  const IconComponent = isKrav ? FileCheck : Wrench;
                  // Mute child icons to 50% opacity, larger icons for parents
                  const iconSize = isChild ? 'w-4 h-4' : 'w-5 h-5';
                  const iconColor = isChild
                    ? (isKrav ? 'text-emerald-600 opacity-50' : 'text-sky-600 opacity-50')
                    : (isKrav ? 'text-emerald-600' : 'text-sky-600');

                  return (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isChild && (
                        <span className="text-slate-300 text-base font-light select-none">├─</span>
                      )}
                      <IconComponent className={`${iconSize} ${iconColor}`} />
                    </div>
                  );
                })()}

                {/* UID + Title combined */}
                {(() => {
                  // Check if this is a child item (has parent OR is related tiltak)
                  const isHierarchicalChild = entity.parentId;
                  const isRelated = entity._relatedToKrav;
                  const isChild = isHierarchicalChild || isRelated;
                  const isKrav = entity.entityType?.toLowerCase().includes('krav');
                  const childLabel = isKrav ? 'Underkrav' : (isRelated ? 'Tilknyttet tiltak' : 'Undertiltak');

                  // Different font sizes and colors for parent vs child
                  // Both underkrav and tilknyttet tiltak are treated the same (muted)
                  const fontSize = isChild ? 'text-base' : 'text-xl';
                  const textColor = isChild ? 'text-slate-600' : 'text-slate-900';

                  if (editMode && onFieldSave && !editingDisabled) {
                    // In edit mode
                    if (isChild) {
                      // For child items, show static label (not editable)
                      return (
                        <h2 className={`${fontSize} font-light ${textColor} leading-snug truncate flex-1 min-w-0`}>
                          {uid && <span className="font-mono text-xs mr-2 text-slate-500">{uid}</span>}
                          {childLabel}
                        </h2>
                      );
                    }

                    // For parent items, show editable field
                    return (
                      <div onClick={(e) => e.stopPropagation()} className="flex-1 min-w-0">
                        {(() => {
                          // Find the title field (tittel, navn, name, or title)
                          const titleFieldName = entity.tittel !== undefined ? 'tittel' :
                                                entity.navn !== undefined ? 'navn' :
                                                entity.name !== undefined ? 'name' : 'title';
                          const titleFieldConfig = allFields.find(f => f.name === titleFieldName);

                          if (titleFieldConfig) {
                            const FieldComponent = FieldResolver.getFieldComponent(titleFieldConfig, entity.entityType);
                            return (
                              <FieldComponent
                                field={titleFieldConfig}
                                value={formData[titleFieldName] ?? entity[titleFieldName] ?? ""}
                                onChange={(eventOrValue) => {
                                  handleFieldChange(eventOrValue);

                                  let actualValue;
                                  if (typeof eventOrValue === "object" && eventOrValue?.target) {
                                    actualValue = eventOrValue.target.value;
                                  } else {
                                    actualValue = eventOrValue;
                                  }

                                  debouncedSave(titleFieldName, actualValue, entity);
                                }}
                                onBlur={(eventOrValue) => {
                                  let actualValue;
                                  if (typeof eventOrValue === "object" && eventOrValue?.target) {
                                    actualValue = eventOrValue.target.value;
                                  } else {
                                    actualValue = formData[titleFieldName] ?? entity[titleFieldName] ?? "";
                                  }
                                  immediateSave(titleFieldName, actualValue, entity);
                                }}
                                className={fontSize + " font-light"}
                                error={null}
                              />
                            );
                          }
                          return (
                            <h2 className={`${fontSize} font-light text-slate-900 leading-snug truncate`}>
                              {uid && <span className="font-mono mr-2">{uid}</span>}
                              {title}
                            </h2>
                          );
                        })()}
                      </div>
                    );
                  }

                  // View mode - show label for children, full title for parents
                  return (
                    <h2 className={`${fontSize} font-light ${textColor} leading-snug truncate flex-1 min-w-0`}>
                      {uid && <span className="font-mono text-xs mr-2 text-slate-500">{uid}</span>}
                      {isChild ? childLabel : title}
                    </h2>
                  );
                })()}
              </div>

              {/* Center-Right: References (parent, special) - inline */}
              {!viewOptions.isTOCMode && (getSpecialReference(entity) || getParentReference(entity)) && (
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                  {getSpecialReference(entity)}
                  {getParentReference(entity)}
                </div>
              )}

              {/* Right: Action buttons - only when selected */}
              {isSelected && (
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {/* Read-only mode: Show copy button */}
                  {(!onFieldSave || editingDisabled) && onCopyToProject && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCopyToProject(entity);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                      title="Kopier til prosjekt"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Kopier til prosjekt
                    </button>
                  )}

                  {/* Edit mode: Show edit/delete buttons */}
                  {onFieldSave && !editingDisabled && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (editMode) {
                            // Exit edit mode by selecting without edit
                            onClick(entity, 'select');
                          } else {
                            // Enter edit mode
                            onClick(entity, 'editCard');
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                          editMode
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        }`}
                        title={editMode ? "Avslutt redigering" : "Rediger (trykk E)"}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        {editMode ? 'Ferdig' : 'Rediger'}
                      </button>
                      {/* Hide delete button in multi-select mode */}
                      {selectionMode === 'single' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClick(entity, 'delete');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-all duration-200 flex items-center gap-1.5"
                          title="Slett"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Slett
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Article Body - Dynamic main content fields from config */}
          {articleViewConfig.mainContentFields.map((fieldName, index) => {
            const fieldValue = entity[fieldName];

            // Get field config to use proper label and type
            const fieldConfig = allFields.find(f => f.name === fieldName);
            if (!fieldConfig) return null;

            // Show field if it has value OR if in edit mode
            const shouldShow = fieldValue || (editMode && onFieldSave && !editingDisabled);
            if (!shouldShow) return null;

            // First field (beskrivelse) has no header, others get a section header
            const showHeader = index > 0;

            return (
              <div key={fieldName} className={showHeader ? "space-y-2" : ""}>
                {showHeader && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {fieldConfig.label}
                  </h3>
                )}
                {editMode && onFieldSave && !editingDisabled ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, entity.entityType);
                      return (
                        <FieldComponent
                          field={fieldConfig}
                          value={formData[fieldName] ?? entity[fieldName] ?? ""}
                          onChange={(eventOrValue) => {
                            // Update form data immediately
                            handleFieldChange(eventOrValue);

                            // Extract actual value
                            let actualValue;
                            if (typeof eventOrValue === "object" && eventOrValue?.target) {
                              actualValue = eventOrValue.target.value;
                            } else {
                              actualValue = eventOrValue;
                            }

                            // Use debounced save for rich text fields
                            debouncedSave(fieldName, actualValue, entity);
                          }}
                          onBlur={(eventOrValue) => {
                            // Save immediately on blur
                            let actualValue;
                            if (typeof eventOrValue === "object" && eventOrValue?.target) {
                              actualValue = eventOrValue.target.value;
                            } else {
                              actualValue = formData[fieldName] ?? entity[fieldName] ?? "";
                            }
                            immediateSave(fieldName, actualValue, entity);
                          }}
                          className="text-base"
                          error={null}
                        />
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-slate-700 leading-normal">
                    {DisplayValueResolver.getDisplayComponent(
                      entity,
                      fieldConfig,
                      'DETAIL',
                      entity.entityType
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Merknad */}
          {viewOptions.showMerknad && (formData[merknadFieldName] || merknadValue || (editMode && onFieldSave && !editingDisabled)) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Merknad</h3>
              {editMode && onFieldSave && !editingDisabled ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mt-1">
                    {(() => {
                      const fieldConfig = getFieldConfig(merknadFieldName);
                      if (fieldConfig) {
                        const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, entity.entityType);
                        return (
                          <FieldComponent
                            field={fieldConfig}
                            value={formData[merknadFieldName] ?? merknadValue ?? ""}
                            onChange={(eventOrValue) => {
                              // Update form data immediately (same pattern as detail view)
                              handleFieldChange(eventOrValue);

                              // Extract actual value
                              let actualValue;
                              if (typeof eventOrValue === "object" && eventOrValue?.target) {
                                actualValue = eventOrValue.target.value;
                              } else {
                                actualValue = eventOrValue;
                              }

                              // Use debounced save for text fields
                              debouncedSave(merknadFieldName, actualValue, entity);
                            }}
                            onBlur={(eventOrValue) => {
                              // Save immediately on blur (click outside)
                              let actualValue;
                              if (typeof eventOrValue === "object" && eventOrValue?.target) {
                                actualValue = eventOrValue.target.value;
                              } else {
                                actualValue = formData[merknadFieldName] ?? merknadValue ?? "";
                              }
                              immediateSave(merknadFieldName, actualValue, entity);
                            }}
                            className="text-sm"
                            error={null}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-700 leading-relaxed pl-4 border-l-2 border-amber-200 bg-amber-50/30 py-2">
                  {formatCardText(formData[merknadFieldName] || merknadValue, isExpandedCards)}
                </div>
              )}
            </div>
          )}

          {/* Metadata Section */}
          <div className="space-y-3 pt-2">
            {/* Status Fields - Horizontal */}
            {(viewOptions.showVurdering || viewOptions.showStatus || viewOptions.showPrioritet || viewOptions.showObligatorisk) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {viewOptions.showVurdering && renderStatusField('vurderingId', getVurderingDisplay, 'Vurdering')}
                {viewOptions.showStatus && renderStatusField('statusId', getStatusDisplay, 'Status')}
                {viewOptions.showPrioritet && renderStatusField('prioritet', getPrioritetDisplay, 'Prioritet')}

                {viewOptions.showObligatorisk && entity.obligatorisk !== undefined && (
                editMode && onFieldSave && !editingDisabled ? (
                  <div
                    className="flex flex-col gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{(() => {
                      const fieldConfig = getFieldConfig('obligatorisk');
                      return fieldConfig?.label || 'Type';
                    })()}</span>
                    <div className="flex-1">
                      {(() => {
                        const fieldConfig = getFieldConfig('obligatorisk');
                        if (fieldConfig) {
                          const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, entity.entityType);
                          return (
                            <FieldComponent
                              field={fieldConfig}
                              value={formData.obligatorisk ?? entity.obligatorisk ?? ""}
                              onChange={(eventOrValue) => {
                                // Update form data immediately (same pattern as detail view)
                                handleFieldChange(eventOrValue);

                                // Extract actual value and save to server
                                let actualValue;
                                if (typeof eventOrValue === "object" && eventOrValue?.target) {
                                  actualValue = eventOrValue.target.value;
                                } else {
                                  actualValue = eventOrValue;
                                }

                                onFieldSave('obligatorisk', actualValue, entity);
                              }}
                              className="text-xs"
                              error={null}
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{(() => {
                      const fieldConfig = getFieldConfig('obligatorisk');
                      return fieldConfig?.label || 'Type';
                    })()}</span>
                    <div className="flex items-center gap-1.5">
                      {(formData.obligatorisk ?? entity.obligatorisk) && (
                        <div className="flex-shrink-0 text-sky-600">
                          {getIcon("Check", 14)}
                        </div>
                      )}
                      <span className="text-slate-900 text-sm font-medium">
                        {(formData.obligatorisk ?? entity.obligatorisk) ? "Ja" : "Nei"}
                      </span>
                    </div>
                  </div>
                )
              )}
              </div>
            )}

            {/* Metadata - Only show files and favoritter (relations shown in hierarchy) */}
            {viewOptions.showRelations && (() => {
              const hasFiles = entity.files?.length > 0;
              const hasFavorites = viewOptions.showFavorites && entity.favorittAvBrukere?.length > 0;

              const hasAnyMetadata = hasFiles || hasFavorites;

              if (!hasAnyMetadata) return null;

              return (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-slate-700">
                    {/* File attachments */}
                    {hasFiles && (
                      <>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Vedlegg:</span>
                        <span className="text-xs">{entity.files.length}</span>
                      </>
                    )}

                    {/* Favoritter */}
                    {hasFavorites && (
                      <>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Favoritter:</span>
                        <span className="text-xs">{entity.favorittAvBrukere.length}</span>
                      </>
                    )}
                </div>
              );
            })()}
          </div>

        </article>
      ) : (
        /* 📋 SPLIT MODE - Compact table-like layout */
        <>
          {/* Line 1: Special and parent references with status indicators */}
          <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
            {/* Left side: References */}
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden">
              {/* Special reference (e.g., generalTiltak) - hide in TOC mode */}
              {!viewOptions.isTOCMode && getSpecialReference(entity)}

              {/* Parent reference for child elements - hide in TOC mode */}
              {!viewOptions.isTOCMode && getParentReference(entity)}
            </div>

            {/* Right side: Status indicators */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
              {viewOptions.showVurdering && <StatusIndicator display={getVurderingDisplay(entity)} iconOnly />}
              {viewOptions.showStatus && <StatusIndicator display={getStatusDisplay(entity)} iconOnly />}
              {viewOptions.showPrioritet && <StatusIndicator display={getPrioritetDisplay(entity)} iconOnly />}
            </div>
          </div>

          {/* Line 2: Combined UID/Type Badge, Title, and action buttons */}
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Multi-select checkbox (only in multi-select mode) */}
              {selectionMode === 'multi' && (
                <input
                  type="checkbox"
                  checked={isItemSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelection(entity.id, {
                      entityType: entity.entityType,
                      renderId: entity.renderId
                    });
                  }}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary cursor-pointer flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <EntityBadge
                uid={uid}
                badgeColor={config.badgeColor}
                badgeText={config.badgeText}
                size="sm"
              />

              <span className={`text-slate-900 ${shouldUseCompactMode ? 'text-sm font-normal' : 'text-lg font-light'}`}>{title}</span>
            </div>
          </div>

          {/* Line 3: Description preview (full width, readable) */}
          {!viewOptions.hideDescriptionSnippet && (entity.beskrivelseSnippet || entity.descriptionSnippet) && (
            <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} text-slate-600 mb-2`}>
              {truncateText(getDescription())}
            </div>
          )}

          {/* Merknad if defined and enabled */}
          {viewOptions.showMerknad && (
            editMode && onFieldSave && !editingDisabled && isExpandedCards ? (
              <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} bg-amber-50 rounded px-2 py-1 mb-2`} onClick={(e) => e.stopPropagation()}>
                <span className={`${shouldUseCompactMode ? 'text-xs' : 'text-xs'} font-medium text-amber-800`}>Merknad:</span>
                <div className="mt-1">
                  {(() => {
                    const fieldConfig = getFieldConfig(merknadFieldName);
                    if (fieldConfig) {
                      const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, entity.entityType);
                      return (
                        <FieldComponent
                          field={fieldConfig}
                          value={formData[merknadFieldName] ?? merknadValue ?? ""}
                          onChange={(eventOrValue) => {
                            // Update form data immediately (same pattern as detail view)
                            handleFieldChange(eventOrValue);
                            
                            // Extract actual value
                            let actualValue;
                            if (typeof eventOrValue === "object" && eventOrValue?.target) {
                              actualValue = eventOrValue.target.value;
                            } else {
                              actualValue = eventOrValue;
                            }
                            
                            // Use debounced save for text fields
                            debouncedSave(merknadFieldName, actualValue, entity);
                          }}
                          onBlur={(eventOrValue) => {
                            // Save immediately on blur (click outside)
                            let actualValue;
                            if (typeof eventOrValue === "object" && eventOrValue?.target) {
                              actualValue = eventOrValue.target.value;
                            } else {
                              actualValue = formData[merknadFieldName] ?? merknadValue ?? "";
                            }
                            immediateSave(merknadFieldName, actualValue, entity);
                          }}
                          className="text-sm"
                          error={null}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ) : (
              // View mode: only show merknad if it has content
              (formData[merknadFieldName] || merknadValue) && (
                <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2`}>
                  <span className={`${shouldUseCompactMode ? 'text-xs' : 'text-xs'} font-medium text-amber-800`}>Merknad:</span> {truncateText(formData[merknadFieldName] || merknadValue, 100)}
                </div>
              )
            )
          )}

          {/* Footer: Meta info and relations */}
          <div className="flex justify-between items-center text-xs text-slate-500">
            <div className="flex items-center gap-3">
              {/* Child count */}
              {viewOptions.showRelations && entity.children?.length > 0 && (
                <span className="text-emerald-600 font-medium">
                  {entity.children.length} {config.childrenLabel || "underelementer"}
                </span>
              )}
              
              {/* Related entities */}
              {config.relations && config.relations.map((relation) => {
                const count = Array.isArray(entity[relation.field]) ? entity[relation.field].length : (entity[relation.field] ? 1 : 0);
                if (count > 0) {
                  return (
                    <span key={relation.field} className={`font-medium ${relation.color}`}>
                      {relation.prefix} {count} {relation.label}
                    </span>
                  );
                }
                return null;
              })}

              {/* Favoritter - if shown */}
              {viewOptions.showFavorites && entity.favorittAvBrukere?.length > 0 && (
                <span className="text-yellow-600 font-medium">
                  ★ {entity.favorittAvBrukere.length} favoritter
                </span>
              )}
              
              {/* File attachments */}
              {viewOptions.showRelations && entity.files?.length > 0 && (
                <span>{entity.files.length} vedlegg</span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Could add created/updated info here */}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default EntityCard;