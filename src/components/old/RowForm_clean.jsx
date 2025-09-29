import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FieldResolver } from "../tableComponents/fieldTypes/fieldResolver.jsx";
import { InfoIcon } from "../ui/InfoIcon.jsx";

// Error display component
const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <div className="mt-1 flex items-center text-sm text-red-600">
      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </div>
  );
};

// Generic field renderer using the new configuration system
const FieldRenderer = ({ field, value, onChange, error, form, row, modelName }) => {
  const Component = FieldResolver.getFieldComponent(field, modelName);

  // Check if the component handles its own label (only for model-specific field names like parentId)
  const componentHandlesOwnLabel = modelName && FieldResolver.getModelSpecificFields(modelName).fieldNames?.[field.name];

  if (componentHandlesOwnLabel) {
    // Component handles its own label (like model-specific field names such as Krav/Enhet parentId)
    return <Component field={field} value={value} onChange={onChange} error={error} form={form} row={row} />;
  }

  // RowForm handles the label for ALL other field types (basic + entity selects)
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">
        {field.label}
        {field.required && <span className="text-error-500 ml-1">*</span>}
        <InfoIcon info={field.field_info} />
      </label>
      <Component field={field} value={value} onChange={onChange} error={error} form={form} row={row} />
    </div>
  );
};

export default function RowForm({
  fields,
  row,
  onSuccess,
  onCancel,
  createFn,
  updateFn,
  queryKey,
  modelPrintName = "rad",
  modelName = "unknown", // New prop to identify the model
}) {
  const editing = !!(row && row.id);

  // Initialize form state using FieldResolver
  const initialForm = fields.reduce((acc, field) => {
    acc[field.name] = FieldResolver.initializeFieldValue(field, row, editing, modelName);
    return acc;
  }, {});

  const [form, setForm] = React.useState(initialForm);
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm(
        fields.reduce((acc, field) => {
          acc[field.name] = FieldResolver.resetFieldValue(field, modelName);
          return acc;
        }, {})
      );
      if (onSuccess) onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Update failed:", error);
    },
  });

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateForm() {
    const newErrors = {};
    const visibleFields = fields.filter((f) => !(editing ? f.hiddenEdit : f.hiddenCreate));

    visibleFields.forEach((field) => {
      const value = form[field.name];
      const error = FieldResolver.validateField(field, value, modelName);

      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationResult = validateForm();
    if (!validationResult) {
      alert("Form validation failed. Check for errors.");

      return;
    }

    alert("Form submitted successfully!"); // Temporary alert
    setIsSubmitting(true);

    if (editing) {
      const updateData = { ...form, id: row.id };
      updateMutation.mutate(updateData, {
        onSettled: () => setIsSubmitting(false),
      });
    } else {
      createMutation.mutate(form, {
        onSettled: () => setIsSubmitting(false),
      });
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">{editing ? `Rediger ${modelPrintName}` : `Ny ${modelPrintName}`}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields
          .filter((f) => !(editing ? f.hiddenEdit : f.hiddenCreate))
          .map((field) => (
            <div key={field.name} className="space-y-2">
              <FieldRenderer
                field={field}
                value={form[field.name]}
                onChange={handleChange}
                error={errors[field.name]}
                form={form}
                row={row}
                modelName={modelName}
              />
              <ErrorDisplay error={errors[field.name]} />
            </div>
          ))}

        <div className="flex gap-3 mt-8 pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className={`btn ${isSubmitting || createMutation.isPending || updateMutation.isPending ? "btn-disabled" : "btn-primary"}`}
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? "Lagrer..."
              : editing
              ? `Oppdater ${modelPrintName}`
              : `Opprett ${modelPrintName}`}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              Avbryt
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
