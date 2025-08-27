import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Generic hook for managing entity workspace CRUD actions
 * Works with any entity type based on model configuration
 */
export const useEntityWorkspaceActions = (modelConfig, entityType, showSuccessToast, showErrorToast) => {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: modelConfig.createFn,
    onSuccess: () => {
      queryClient.invalidateQueries([entityType]);
      showSuccessToast(`${modelConfig.title || entityType} opprettet`);
    },
    onError: (error) => {
      console.error("Create error:", error);
      showErrorToast(`Kunne ikke opprette ${modelConfig.title?.toLowerCase() || entityType}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: modelConfig.updateFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries([entityType]);
      // Update specific entity cache
      queryClient.setQueryData([entityType, data.id], data);
      showSuccessToast(`${modelConfig.title || entityType} oppdatert`);
    },
    onError: (error) => {
      console.error("Update error:", error);
      showErrorToast(`Kunne ikke oppdatere ${modelConfig.title?.toLowerCase() || entityType}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: modelConfig.deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries([entityType]);
      showSuccessToast(`${modelConfig.title || entityType} slettet`);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      showErrorToast(`Kunne ikke slette ${modelConfig.title?.toLowerCase() || entityType}`);
    },
  });

  // Save handler (create or update)
  const handleSave = async (data, isUpdate = false) => {
    try {
      if (isUpdate) {
        const result = await updateMutation.mutateAsync(data);
        return result;
      } else {
        const result = await createMutation.mutateAsync(data);
        return result;
      }
    } catch (error) {
      throw error;
    }
  };

  // Delete confirmation handler
  const confirmDelete = async (entity) => {
    const entityName = modelConfig.title?.toLowerCase() || entityType;
    const displayName = entity.tittel || entity.navn || `${entityName} ${entity.id}`;
    
    if (window.confirm(`Er du sikker på at du vil slette ${entityName} "${displayName}"?`)) {
      try {
        await deleteMutation.mutateAsync(entity.id);
      } catch (error) {
        // Error already handled in mutation
      }
    }
  };

  return {
    handleSave,
    confirmDelete,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
};