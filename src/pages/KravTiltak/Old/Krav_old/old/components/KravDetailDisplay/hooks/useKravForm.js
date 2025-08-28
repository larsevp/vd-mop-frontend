import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";

/**
 * Custom hook for managing Krav form state and operations
 */
export const useKravForm = ({ krav, mode, modelConfig, onSave, user }) => {
  const isEditing = mode === "edit" || mode === "create";
  const isCreating = mode === "create";
  const queryClient = useQueryClient();

  // Get visible fields for the current mode
  const visibleFields = useMemo(() => {
    return modelConfig.fields.filter((field) => !(isEditing ? (isCreating ? field.hiddenCreate : field.hiddenEdit) : field.hiddenView));
  }, [modelConfig.fields, isEditing, isCreating]);

  // Initialize form with field values (only for edit/create modes)
  const initialForm = useMemo(() => {
    if (!isEditing) return {};

    const formData = visibleFields.reduce((acc, field) => {
      let fieldValue = FieldResolver.initializeFieldValue(field, krav, !isCreating, modelConfig.modelPrintName);

      // Handle special default value for user's enhetId
      if (isCreating && field.name === "enhetId" && field.defaultValue === "USER_ENHET_ID" && user?.enhetId) {
        fieldValue = user.enhetId;
      }

      acc[field.name] = fieldValue;
      return acc;
    }, {});

    return formData;
  }, [visibleFields, krav, isCreating, isEditing, modelConfig.modelPrintName, user, mode]);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update form when initialForm changes (e.g., when switching modes or krav data changes)
  React.useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  // Helper function to get field configuration by name
  const getField = (fieldName) => {
    return modelConfig.fields.find((field) => field.name === fieldName);
  };

  // Mutations for edit/create modes
  const createMutation = useMutation({
    mutationFn: modelConfig.createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelConfig.queryKey });
      onSave?.();
    },
    onError: (error) => {
      console.error("Create error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateData) => modelConfig.updateFn(krav.id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelConfig.queryKey });
      onSave?.();
    },
    onError: (error) => {
      console.error("Update error:", error);
    },
  });

  // Form handlers
  const handleFieldChange = (fieldName, value) => {
    setForm((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isCreating) {
        await createMutation.mutateAsync(form);
      } else {
        await updateMutation.mutateAsync(form);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    isEditing,
    isCreating,
    visibleFields,
    getField,
    handleFieldChange,
    handleSubmit,
  };
};
