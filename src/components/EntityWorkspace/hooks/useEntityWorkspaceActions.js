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
      // Ultra-specific cache invalidation - only invalidate workspace queries for this entity type
      queryClient.invalidateQueries({
        queryKey: [entityType, "workspace", "paginated"],
        exact: false,
      });

      // For tiltak and krav, also invalidate combined entities cache with correct entity type
      if (entityType === "tiltak" || entityType === "krav") {
        queryClient.invalidateQueries({
          queryKey: ["combinedEntities", "workspace", "paginated"],
          exact: false,
        });
      }

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
      // Ultra-specific cache invalidation - only invalidate workspace queries for this entity type
      queryClient.invalidateQueries({
        queryKey: [entityType, "workspace", "paginated"],
        exact: false,
      });

      // For tiltak and krav, also invalidate combined entities cache with correct entity type
      if (entityType === "tiltak" || entityType === "krav") {
        queryClient.invalidateQueries({
          queryKey: ["combinedEntities", "workspace", "paginated"],
          exact: false,
        });
      }

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
      // Ultra-specific cache invalidation - only invalidate workspace queries for this entity type
      queryClient.invalidateQueries({
        queryKey: [entityType, "workspace", "paginated"],
        exact: false,
      });

      // For tiltak and krav, also invalidate combined entities cache with correct entity type
      if (entityType === "tiltak" || entityType === "krav") {
        queryClient.invalidateQueries({
          queryKey: ["combinedEntities", "workspace", "paginated"],
          exact: false,
        });
      }

      showSuccessToast(`${modelConfig.title || entityType} slettet`);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      showErrorToast(`Kunne ikke slette ${modelConfig.title?.toLowerCase() || entityType}`);
    },
  });

  const handleCreate = (data) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (id, data) => {
    // Combine id and data into a single object for the API call
    const updateData = { ...data, id };
    updateMutation.mutate(updateData);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // Combined save handler for EntityDetailPane - handles both create and update
  const handleSave = (data, isUpdate = false) => {
    if (isUpdate) {
      // For updates, extract ID from data and call update
      const { id, ...updateData } = data;
      handleUpdate(id, updateData);
    } else {
      // For creates, pass data directly to create
      handleCreate(data);
    }
  };

  return {
    // Mutation objects
    createMutation,
    updateMutation,
    deleteMutation,

    // Handler functions
    handleCreate,
    handleUpdate,
    handleDelete,
    handleSave,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Combined loading state
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,

    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};

export default useEntityWorkspaceActions;
