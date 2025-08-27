import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";

/**
 * Custom hook for managing Tiltak CRUD actions
 * Provides consistent mutation handling with optimistic updates
 */
export const useTiltakActions = (showSuccessToast, showErrorToast) => {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: tiltakConfig.createFn,
    onSuccess: () => {
      queryClient.invalidateQueries(["tiltak"]);
      showSuccessToast("Tiltak opprettet");
    },
    onError: (error) => {
      console.error("Create error:", error);
      showErrorToast("Kunne ikke opprette tiltak");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: tiltakConfig.updateFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tiltak"]);
      // Update specific tiltak cache
      queryClient.setQueryData(["tiltak", data.id], data);
      showSuccessToast("Tiltak oppdatert");
    },
    onError: (error) => {
      console.error("Update error:", error);
      showErrorToast("Kunne ikke oppdatere tiltak");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tiltakConfig.deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries(["tiltak"]);
      showSuccessToast("Tiltak slettet");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      showErrorToast("Kunne ikke slette tiltak");
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
  const confirmDelete = async (tiltak) => {
    if (window.confirm(`Er du sikker på at du vil slette tiltaket "${tiltak.tittel}"?`)) {
      try {
        await deleteMutation.mutateAsync(tiltak.id);
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