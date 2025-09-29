import React, { useEffect, useRef } from "react";
import { EmneSelect } from "../../../ui/form/EmneSelect";
import { useEmneInheritance } from "../../../../hooks/useEmneInheritance";

export const emneSelectType = {
  emneselect: ({ field, value, onChange, error, formData, form, row, data, modelName }) => {
    // Determine entity type from context - use modelName to determine the correct entity type
    const getEntityTypeFromModel = (modelName) => {
      switch (modelName) {
        case 'krav':
          return 'krav';
        case 'prosjektKrav':
          return 'prosjektKrav';
        case 'prosjektTiltak':
          return 'prosjektTiltak';
        case 'tiltak':
        default:
          return 'tiltak';
      }
    };
    
    // IMPORTANT: Stabilize entityType to prevent hook consistency errors
    const entityType = React.useMemo(() => getEntityTypeFromModel(modelName), [modelName]);

    // Get entity ID from formData, row, or data for proper inheritance tracking
    const isNewEntity = formData?.__isNew || row?.__isNew || data?.__isNew;
    const entityId = isNewEntity ? 'create-new' : (formData?.id || row?.id || data?.id);

    const {
      inheritedEmne,
      hasInheritance,
      isFieldDisabled,
      getDisabledPlaceholder,
      hasParentConnection,
      hasRelatedEntityConnection
    } = useEmneInheritance(entityType, entityId);

    // Track which entities we've already cleared to avoid repeated clearing
    const clearedEntitiesRef = useRef(new Set());
    // Track user interaction to prevent clearing after manual selections
    // Use a more persistent key that survives component remounts
    const userInteractionKey = `emneSelect_userInteraction_${entityType}_${entityId}_${field.name}`;
    const hasUserInteracted = sessionStorage.getItem(userInteractionKey) === 'true';


    // Apply inheritance when store updates (including blank/null values from connections)
    useEffect(() => {
      // Only apply inheritance if user hasn't manually interacted with the field
      if (hasUserInteracted) {
        return; // User has manually selected a value, don't override it
      }

      // Add a small delay to prevent race conditions with user interactions
      const timeoutId = setTimeout(() => {
        // Double-check user interaction flag after delay
        if (sessionStorage.getItem(userInteractionKey) === 'true') {
          return;
        }

        // If there's a parent or krav connection, always sync the emne value (even if null/blank)
        if ((hasParentConnection || hasRelatedEntityConnection) && value !== inheritedEmne) {
          onChange({ target: { name: field.name, value: inheritedEmne } });
        }
        // Legacy: also sync if there's an actual inherited emne value
        else if (inheritedEmne && value !== inheritedEmne) {
          onChange({ target: { name: field.name, value: inheritedEmne } });
        }
      }, 10); // Very short delay to allow user interaction to register

      return () => clearTimeout(timeoutId);
    }, [inheritedEmne, value, onChange, field.name, hasParentConnection, hasRelatedEntityConnection]);

    // Clear field value when switching to new entity with no inheritance (but respect user interaction)
    useEffect(() => {
      const isNewEntity = entityId === 'create-new' || entityId?.toString().includes('create');

      // Only clear if user hasn't manually interacted with this field
      if (hasUserInteracted) {
        return; // Don't clear user selections
      }

      // If this is a new entity and there's no inheritance, clear the field value
      if (isNewEntity && !inheritedEmne && !hasParentConnection && !hasRelatedEntityConnection && value) {
        onChange({ target: { name: field.name, value: null } });
      }
    }, [entityId, inheritedEmne, hasParentConnection, hasRelatedEntityConnection, value, onChange, field.name, hasUserInteracted]);

    // Reset interaction flag when switching entities (but not on every render)
    useEffect(() => {
      sessionStorage.removeItem(userInteractionKey);
    }, [entityId, userInteractionKey]); // Only reset when entityId actually changes

    // Use inherited value if available, otherwise use form value
    // But if user has interacted, prioritize their selection
    const effectiveValue = (hasUserInteracted && value !== null) ? value : (inheritedEmne || value);
    const disabled = isFieldDisabled('emne');
    const placeholder = getDisabledPlaceholder('emne') || field.placeholder;

    // Wrap onChange to mark user interaction
    const handleChange = (event) => {
      sessionStorage.setItem(userInteractionKey, 'true');
      onChange(event);
    };

    return (
      <EmneSelect
        name={field.name}
        value={effectiveValue}
        onChange={disabled ? () => {} : handleChange}
        label={field.label}
        required={disabled ? false : field.required}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
      />
    );
  },
};
