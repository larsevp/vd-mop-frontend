import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";

export const validateForm = (visibleFields, formData, modelName) => {
  const newErrors = {};

  visibleFields.forEach((field) => {
    const value = formData[field.name];
    const error = FieldResolver.validateField(field, value, modelName);

    if (error) {
      newErrors[field.name] = error;
    }
  });

  return newErrors;
};

export const autoExpandErrorSections = (errors, visibleFields, setExpandedSections) => {
  if (!errors || Object.keys(errors).length === 0) return;

  const sectionsWithErrors = new Set();
  
  visibleFields.forEach((field) => {
    if (errors[field.name]) {
      const sectionName = field.detailSection || "main";
      sectionsWithErrors.add(sectionName);
    }
  });

  if (sectionsWithErrors.size > 0) {
    setExpandedSections(prev => new Set([...prev, ...sectionsWithErrors]));
  }
};