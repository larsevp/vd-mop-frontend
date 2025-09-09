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
    Swal.fire({
      icon: "error",
      title: "Lagringsfeil",
      text: error?.message || "Kunne ikke lagre endringer",
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