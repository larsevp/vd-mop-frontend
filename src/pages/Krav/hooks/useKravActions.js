import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import Swal from "sweetalert2";

/**
 * Custom hook for Krav CRUD actions
 * Separates business logic from UI logic
 */
export const useKravActions = (onSuccess, onError) => {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: kravConfig.deleteFn,
    onSuccess: () => {
      // Only invalidate after successful delete
      queryClient.invalidateQueries({
        queryKey: ["krav-workspace"],
        exact: false, // Invalidate all variations of the key
      });
      onSuccess?.("Krav slettet!", "success");
    },
    onError: (error) => {
      onError?.(`Feil ved sletting: ${error?.response?.data?.message || error.message}`, "error");
    },
  });

  // Save mutation (create/update)
  const saveMutation = useMutation({
    mutationFn: async ({ isEditing, data }) => {
      if (isEditing) {
        return kravConfig.updateFn(data.id, data);
      } else {
        return kravConfig.createFn(data);
      }
    },
    onSuccess: (data, variables) => {
      // Only invalidate after successful save
      queryClient.invalidateQueries({
        queryKey: ["krav-workspace"],
        exact: false, // Invalidate all variations of the key
      });
      const message = variables.isEditing ? "Krav oppdatert!" : "Krav opprettet!";
      onSuccess?.(message, "success");
    },
    onError: (error) => {
      onError?.(`Feil ved lagring: ${error?.response?.data?.message || error.message}`, "error");
    },
  });

  // Confirm delete with SweetAlert
  const confirmDelete = useCallback(
    (krav) => {
      Swal.fire({
        title: "Er du sikker?",
        text: `Vil du slette kravet "${krav.tittel}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ja, slett",
        cancelButtonText: "Avbryt",
      }).then((result) => {
        if (result.isConfirmed) {
          deleteMutation.mutate(krav.id);
        }
      });
    },
    [deleteMutation]
  );

  // Save handler
  const handleSave = useCallback(
    async (data, isEditing = false) => {
      return new Promise((resolve, reject) => {
        saveMutation.mutate(
          { isEditing, data },
          {
            onSuccess: (result) => {
              resolve(result);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
    },
    [saveMutation]
  );

  return {
    confirmDelete,
    handleSave,
    isDeleting: deleteMutation.isPending,
    isSaving: saveMutation.isPending,
  };
};
