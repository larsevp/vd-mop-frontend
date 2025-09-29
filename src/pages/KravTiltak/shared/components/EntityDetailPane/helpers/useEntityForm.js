import { useState, useEffect, useCallback } from 'react';
import { initializeFormData } from './fieldHelpers';

/**
 * Shared hook for entity form management
 * Reuses the same form data logic as EntityDetailPane for consistency
 */
export const useEntityForm = (entity, allFields, modelName) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize form data when entity changes
  useEffect(() => {
    if (entity && allFields) {
      const initialForm = initializeFormData(allFields, entity, modelName);
      setFormData(initialForm);
      setErrors({}); // Reset errors when entity changes
    }
  }, [entity?.id]); // Only reset when entity ID changes, not on field or model changes

  // Update form data when fields or model change (without clearing errors)
  useEffect(() => {
    if (entity && allFields) {
      const initialForm = initializeFormData(allFields, entity, modelName);
      setFormData(initialForm);
    }
  }, [entity, allFields, modelName]);

  // Field change handler - same logic as EntityDetailPane
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
    
    // Clear field error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  }, [errors]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    handleFieldChange
  };
};