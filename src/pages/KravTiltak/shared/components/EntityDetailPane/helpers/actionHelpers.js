import Swal from "sweetalert2";

export const handleSaveAction = async (validateForm, formData, entity, onSave, setIsSubmitting, setIsEditing) => {
  const validationErrors = validateForm();
  if (Object.keys(validationErrors).length > 0) {
    return { success: false, errors: validationErrors };
  }

  setIsSubmitting(true);
  try {
    const isNewEntity = entity?.__isNew;
    let saveData;
    
    if (isNewEntity) {
      saveData = { ...formData };
      delete saveData.id;
    } else {
      saveData = { ...formData, id: entity.id };
    }
    
    if (onSave) {
      const result = await onSave(saveData, !isNewEntity);
      setIsEditing(false);
      return { success: true, result };
    } else {
      console.error('No onSave handler provided');
      Swal.fire({
        icon: "error",
        title: "Konfigureringsfeil",
        text: "Ingen lagringsfunksjon tilgjengelig",
        confirmButtonText: "OK",
      });
      return { success: false, error: "No save handler" };
    }
  } catch (error) {
    console.error('Save error:', error);

    // Check if it's a validation error from the backend (400 status with validation details)
    if (error?.response?.status === 400 && error?.response?.data?.errors) {
      // Backend validation errors - return them to be displayed in the form
      return { success: false, errors: error.response.data.errors };
    }

    // Check for other structured error responses
    let errorMessage = error?.response?.data?.message ||
                      error?.response?.data?.error ||
                      error?.message ||
                      "Kunne ikke lagre endringer";

    // Convert database constraint messages to user-friendly Norwegian
    if (errorMessage.includes("notNull Violation:") && errorMessage.includes("tittel cannot be null")) {
      errorMessage = "Tittel er påkrevet og kan ikke være tom";
    } else if (errorMessage.includes("notNull Violation:") && errorMessage.includes("cannot be null")) {
      // Extract field name from the error message
      const fieldMatch = errorMessage.match(/(\w+)\.(\w+) cannot be null/);
      if (fieldMatch) {
        const fieldName = fieldMatch[2];
        errorMessage = `${fieldName} er påkrevet og kan ikke være tom`;
      }
    }

    Swal.fire({
      icon: "error",
      title: "Lagringsfeil",
      text: errorMessage,
      confirmButtonText: "OK",
    });
    return { success: false, error };
  } finally {
    setIsSubmitting(false);
  }
};

export const handleDeleteAction = async (entity, onDelete) => {
  const result = await Swal.fire({
    title: 'Slett element?',
    text: "Denne handlingen kan ikke angres.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Slett',
    cancelButtonText: 'Avbryt'
  });

  if (result.isConfirmed) {
    try {
      await onDelete(entity);
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire({
        icon: "error",
        title: "Slettingsfeil",
        text: error?.message || "Kunne ikke slette element",
        confirmButtonText: "OK",
      });
      return { success: false, error };
    }
  }
  return { success: false, cancelled: true };
};