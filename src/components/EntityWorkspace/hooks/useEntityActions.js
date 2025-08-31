import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { EntityTypeResolver } from "../services/EntityTypeResolver";

/**
 * useEntityActions - Specialized CRUD actions hook following SRP
 * Single responsibility: Handle entity CRUD operations and cache management
 */
export const useEntityActions = ({
  entityType,
  modelConfig,
  onSuccess,
  onError
}) => {
  const queryClient = useQueryClient();

  // Resolve API configuration
  const apiConfig = EntityTypeResolver.resolveApiConfig(entityType, modelConfig);

  // Cache invalidation helper
  const invalidateEntityCaches = useCallback(() => {
    // Invalidate workspace queries for this entity type
    queryClient.invalidateQueries({
      queryKey: [entityType, "workspace", "paginated"],
      exact: false,
    });

    // For all krav and tiltak types, also invalidate combined entities cache
    if (entityType === "tiltak" || entityType === "krav" || entityType === "prosjekt-krav" || entityType === "prosjekt-tiltak") {
      queryClient.invalidateQueries({
        queryKey: ["combinedEntities", "workspace", "paginated"],
        exact: false,
      });
    }
    
    // Also invalidate the broader workspace queries without "paginated" suffix
    queryClient.invalidateQueries({
      queryKey: [entityType, "workspace"],
      exact: false,
    });
  }, [queryClient, entityType]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: apiConfig.createFn,
    onSuccess: (data) => {
      invalidateEntityCaches();
      onSuccess?.(`${modelConfig.title || entityType} opprettet`, 'success');
    },
    onError: (error) => {
      console.error("Create error:", error);
      onError?.(`Kunne ikke opprette ${modelConfig.title?.toLowerCase() || entityType}`, 'error');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: apiConfig.updateFn,
    onSuccess: (data) => {
      invalidateEntityCaches();
      // Update specific entity cache
      queryClient.setQueryData([entityType, data.id], data);
      onSuccess?.(`${modelConfig.title || entityType} oppdatert`, 'success');
    },
    onError: (error) => {
      console.error("Update error:", error);
      onError?.(`Kunne ikke oppdatere ${modelConfig.title?.toLowerCase() || entityType}`, 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: apiConfig.deleteFn,
    onSuccess: () => {
      invalidateEntityCaches();
      onSuccess?.(`${modelConfig.title || entityType} slettet`, 'success');
    },
    onError: (error) => {
      console.error("Delete error:", error);
      onError?.(`Kunne ikke slette ${modelConfig.title?.toLowerCase() || entityType}`, 'error');
    },
  });

  // Action handlers
  const handleCreate = useCallback((data) => {
    if (!apiConfig.createFn) {
      onError?.('Create operation not supported for this entity type', 'error');
      return Promise.reject(new Error('Create not supported'));
    }
    return createMutation.mutateAsync(data);
  }, [createMutation, apiConfig.createFn, onError]);

  const handleUpdate = useCallback((id, data) => {
    if (!apiConfig.updateFn) {
      onError?.('Update operation not supported for this entity type', 'error');
      return Promise.reject(new Error('Update not supported'));
    }
    
    // Combine id and data into a single object for the API call
    const updateData = { ...data, id };
    return updateMutation.mutateAsync(updateData);
  }, [updateMutation, apiConfig.updateFn, onError]);

  const handleDelete = useCallback((id) => {
    if (!apiConfig.deleteFn) {
      onError?.('Delete operation not supported for this entity type', 'error');
      return Promise.reject(new Error('Delete not supported'));
    }
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation, apiConfig.deleteFn, onError]);

  // Combined save handler for forms - handles both create and update
  const handleSave = useCallback(async (data, isUpdate = false) => {
    try {
      if (isUpdate) {
        // For updates, extract ID from data and call update
        const { id, ...updateData } = data;
        const result = await handleUpdate(id, updateData);
        return result;
      } else {
        // For creates, pass data directly to create
        const result = await handleCreate(data);
        return result;
      }
    } catch (error) {
      // Re-throw for component handling
      throw error;
    }
  }, [handleCreate, handleUpdate]);

  // Optimistic update helpers
  const optimisticallyUpdateEntity = useCallback((entityId, updates) => {
    const queryKey = [entityType, entityId];
    const currentData = queryClient.getQueryData(queryKey);
    
    if (currentData) {
      queryClient.setQueryData(queryKey, { ...currentData, ...updates });
    }
    
    return () => {
      // Rollback function
      if (currentData) {
        queryClient.setQueryData(queryKey, currentData);
      }
    };
  }, [queryClient, entityType]);

  const optimisticallyDeleteEntity = useCallback((entityId) => {
    const queryKey = [entityType, entityId];
    const currentData = queryClient.getQueryData(queryKey);
    
    queryClient.setQueryData(queryKey, null);
    
    return () => {
      // Rollback function
      if (currentData) {
        queryClient.setQueryData(queryKey, currentData);
      }
    };
  }, [queryClient, entityType]);

  return {
    // Primary action handlers
    handleCreate,
    handleUpdate,
    handleDelete,
    handleSave,

    // Mutation objects (for advanced usage)
    createMutation,
    updateMutation,
    deleteMutation,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,

    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    hasErrors: !!createMutation.error || !!updateMutation.error || !!deleteMutation.error,

    // Capability flags
    canCreate: !!apiConfig.createFn,
    canUpdate: !!apiConfig.updateFn,
    canDelete: !!apiConfig.deleteFn,

    // Optimistic update helpers
    optimisticallyUpdateEntity,
    optimisticallyDeleteEntity,

    // Cache management
    invalidateEntityCaches
  };
};

export default useEntityActions;