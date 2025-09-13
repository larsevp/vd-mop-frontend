import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";

// Import helpers
import { truncateText, getEntityTitle, formatCardText } from './helpers/textHelpers';
import { getIcon } from './helpers/iconHelpers.jsx';
import { getStatusDisplay, getVurderingDisplay, getPrioritetDisplay } from '../../utils/statusHelpers';
import { getSpecialReference, getParentReference } from './helpers/referenceHelpers.jsx';

// Import components
import StatusIndicator from '../StatusIndicator';
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
    
    // Also check if the click originated from our action buttons specifically
    const isActionButton = target.closest('button[title="Rediger (trykk E)"], button[title="Slett"]');
    
    if (isInteractiveElement || isInsideSelect || isInsideRadixSelect || isActionButton) {
      return;
    }
    
    // Just select the card, don't go into edit mode
    onClick(entity, 'select');
  };

  const handleDoubleClick = () => {
    onDoubleClick(entity);
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
    if (isExpandedCards && entity.beskrivelse) {
      // Use DisplayValueResolver for rich text rendering in expanded cards mode
      const beskrivelseField = { name: 'beskrivelse', type: 'basicrichtext' };
      const context = { 
        format: 'REACT', 
        source: 'DETAIL' // Show full content without truncation
      };
      return DisplayValueResolver.resolveDisplayValue(entity, beskrivelseField, context);
    } else {
      // Use snippet for compact split view
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

  // Helper to get the correct merknad field name (merknad vs merknader)
  const getMerknadFieldName = () => {
    const merknadConfig = getFieldConfig('merknad');
    const merknaderConfig = getFieldConfig('merknader');
    if (merknadConfig) return 'merknad';
    if (merknaderConfig) return 'merknader';
    return 'merknad'; // fallback
  };

  const merknadFieldName = getMerknadFieldName();
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
            className="flex items-center gap-1 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-gray-500 w-16 flex-shrink-0 font-medium">{label}:</span>
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
        <div className="flex items-center gap-1">
          <span className="text-gray-500 w-16 flex-shrink-0 font-medium">{label}:</span>
          <span className="text-gray-400 text-sm italic">Ikke satt</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 w-16 flex-shrink-0 font-medium">{label}:</span>
        <div style={{ color: display.color }}>
          {getIcon(display.icon, 12)}
        </div>
        <span className="text-gray-900 font-medium">{display.text}</span>
      </div>
    );
  };

  return (
    <div
      data-entity-id={dataEntityId}
      className={`
        relative cursor-pointer block ${shouldIndent && isExpandedCards ? '' : 'w-full'}
        ${isExpandedCards 
          ? `bg-white rounded-xl shadow-sm hover:shadow-md mb-8 p-8 ${shouldIndent ? 'ml-8' : ''} ${isSelected ? 'border-2 border-blue-300 bg-blue-50' : 'border border-gray-200'}`
          : `mb-1 px-4 py-3 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} ${shouldIndent ? 'relative' : ''}`
        }
      `}
      style={shouldIndent && isExpandedCards ? { width: 'calc(100% - 2rem)' } : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >

      <div className={isExpandedCards ? '' : (shouldIndent ? 'ml-8' : '')}>
        {isExpandedCards ? (
          /* 🎨 CARDS MODE - Main content on left, status box on right */
        <div className="flex gap-4">
          {/* Main content area */}
          <div className="flex-1">
            {/* Line 1: Special and parent references */}
            <div className="flex items-center gap-2 mb-1 min-w-0 overflow-hidden">
              {/* Special reference (e.g., generalTiltak) */}
              {getSpecialReference(entity)}

              {/* Parent reference for child elements */}
              {getParentReference(entity)}
            </div>

            {/* Line 2: Badge, UID, Title, and action buttons */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Entity type indicator - bigger */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badgeColor}`}>
                  {config.badgeText}
                </span>
                
                {/* UID - bigger */}
                {uid && (
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${config.badgeColor}`}>
                    [{uid}]
                  </span>
                )}
                
                <span className={`font-medium text-gray-900 ${shouldUseCompactMode ? 'text-sm' : 'text-base'}`}>{title}</span>
              </div>
              {/* Action buttons for cards mode - Only show when selected */}
              {isSelected && (
                <div className="flex gap-1 ml-4">
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
                    className={`px-2 py-1 text-xs font-medium rounded hover:bg-blue-100 transition-colors duration-150 flex items-center gap-1 ${
                      editMode 
                        ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                        : 'text-blue-600 bg-blue-50'
                    }`}
                    title={editMode ? "Avslutt redigering" : "Rediger (trykk E)"}
                  >
                    <Edit className="w-3 h-3" />
                    {editMode ? 'Avslutt redigering' : 'Rediger'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onClick(entity, 'delete');
                    }}
                    className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors duration-150 flex items-center gap-1"
                    title="Slett"
                  >
                    <Trash2 className="w-3 h-3" />
                    Slett
                  </button>
                </div>
              )}
            </div>

            {/* Line 3: Rich description - MAIN DIFFERENCE: Full rich text in cards */}
            {(entity.beskrivelse || entity.beskrivelseSnippet || entity.descriptionSnippet) && (
              <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} text-gray-600 mb-3 prose prose-sm max-w-none`}>
                {getDescription()}
              </div>
            )}

            {/* Merknad */}
            {viewOptions.showMerknad && (
              editMode && onFieldSave && !editingDisabled && isExpandedCards ? (
                <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} bg-amber-50 rounded px-2 py-1 mb-3`} onClick={(e) => e.stopPropagation()}>
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
                  <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} text-amber-700 bg-amber-50 rounded px-2 py-1 mb-3`}>
                    <span className={`${shouldUseCompactMode ? 'text-xs' : 'text-xs'} font-medium text-amber-800`}>Merknad:</span>
                    <div className="mt-1 whitespace-pre-wrap">
                      {formatCardText(formData[merknadFieldName] || merknadValue, isExpandedCards)}
                    </div>
                  </div>
                )
              )
            )}

            {/* Footer: Meta info and relations */}
            <div className="flex justify-between items-center text-xs text-gray-500">
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

                {/* Favoritter */}
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
            </div>
          </div>

          {/* Status section on the right */}
          <div className="pl-6 min-w-[160px] relative">
            <div className="space-y-2 text-xs">
              {viewOptions.showVurdering && renderStatusField('vurderingId', getVurderingDisplay, 'Vurdering')}
              {viewOptions.showStatus && renderStatusField('statusId', getStatusDisplay, 'Status')}
              {viewOptions.showPrioritet && renderStatusField('prioritet', getPrioritetDisplay, 'Prioritet')}
              
              {viewOptions.showObligatorisk && entity.obligatorisk !== undefined && (
                editMode && onFieldSave && !editingDisabled ? (
                  <div 
                    className="flex items-center gap-1 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-gray-500 w-20 flex-shrink-0 font-medium">{(() => {
                      const fieldConfig = getFieldConfig('obligatorisk');
                      return fieldConfig?.label || 'Type';
                    })()}:</span>
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
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 w-20 flex-shrink-0 font-medium">{(() => {
                      const fieldConfig = getFieldConfig('obligatorisk');
                      return fieldConfig?.label || 'Type';
                    })()}:</span>
                    <div 
                      className={`flex-shrink-0 ${entity.obligatorisk ? 'text-blue-600' : 'text-green-600'}`}
                    >
                      {getIcon("Check", 12)}
                    </div>
                    <span className="text-gray-900 font-medium">
                      {entity.obligatorisk ? "Ja" : "Nei"}
                    </span>
                  </div>
                )
              )}
            </div>
            
            {/* View Details Button - Only show when selected */}
            {isSelected && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the card click
                    handleDoubleClick();
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Vis detaljer
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 📋 SPLIT MODE - Compact table-like layout */
        <>
          {/* Line 1: Special and parent references with status indicators */}
          <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
            {/* Left side: References */}
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden">
              {/* Special reference (e.g., generalTiltak) */}
              {getSpecialReference(entity)}

              {/* Parent reference for child elements */}
              {getParentReference(entity)}
            </div>

            {/* Right side: Status indicators */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
              {viewOptions.showVurdering && <StatusIndicator display={getVurderingDisplay(entity)} iconOnly />}
              {viewOptions.showStatus && <StatusIndicator display={getStatusDisplay(entity)} iconOnly />}
              {viewOptions.showPrioritet && <StatusIndicator display={getPrioritetDisplay(entity)} iconOnly />}
              
              {/* Obligatorisk indicator */}
              {viewOptions.showObligatorisk && entity.obligatorisk !== undefined && (
                <div 
                  className={`flex-shrink-0 ${entity.obligatorisk ? 'text-blue-600' : 'text-green-600'}`} 
                  title={entity.obligatorisk ? "Obligatorisk" : "Valgfri"}
                >
                  {getIcon("Check", 12)}
                </div>
              )}
            </div>
          </div>

          {/* Line 2: Badge, UID, Title, and action buttons */}
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Entity type indicator - bigger */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badgeColor}`}>
                {config.badgeText}
              </span>
              
              {/* UID - bigger */}
              {uid && (
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${config.badgeColor}`}>
                  [{uid}]
                </span>
              )}
              
              <span className={`font-medium text-gray-900 ${shouldUseCompactMode ? 'text-sm' : 'text-base'}`}>{title}</span>
            </div>
          </div>

          {/* Line 3: Description preview (full width, readable) */}
          {(entity.beskrivelseSnippet || entity.descriptionSnippet) && (
            <div className={`${shouldUseCompactMode ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
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
          <div className="flex justify-between items-center text-xs text-gray-500">
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