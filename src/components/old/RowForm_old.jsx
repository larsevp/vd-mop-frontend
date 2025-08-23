import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NumberInput from "./NumberInput";
import EnhetSelect from "./EnhetSelect";
import ParentSelectField from "./ParentSelectField";
import { StatusSelect } from "@/components/ui/form/StatusSelect";
import { VurderingSelect } from "@/components/ui/form/VurderingSelect";
import { EmneSelect } from "@/components/ui/form/EmneSelect";
import { KravStatusSelect } from "@/components/ui/form/EnumSelect";
import { BooleanSelect } from "@/components/ui/form/BooleanSelect";
import { KravreferansetypeSelect } from "../ui/form/Kravreferansetype";
import { KravSelect } from "../ui/form/KravSelect";

export default function RowForm_old({ fields, row, onSuccess, onCancel, createFn, updateFn, queryKey, modelPrintName = "rad" }) {
  const editing = !!(row && row.id);
  const initialForm = fields.reduce((acc, f) => {
    // Handle null/undefined values properly to avoid React warnings
    let value;

    if (f.type === "bool") {
      // For boolean fields, handle default value properly
      value = row && row[f.name] !== undefined && row[f.name] !== null ? row[f.name] : f.default !== undefined ? f.default : null;
    } else {
      value = row && row[f.name] !== undefined && row[f.name] !== null ? row[f.name] : f.type === "select" ? f.options[0].value : "";
    }

    // For boolean fields, keep null as null, for others ensure not null
    acc[f.name] = f.type === "bool" ? value : value === null ? "" : value;
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
        fields.reduce((acc, f) => {
          if (f.type === "bool") {
            acc[f.name] = f.default !== undefined ? f.default : null;
          } else {
            acc[f.name] = f.type === "select" ? f.options[0].value : "";
          }
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
      setForm(
        fields.reduce((acc, f) => {
          if (f.type === "bool") {
            acc[f.name] = f.default !== undefined ? f.default : null;
          } else {
            acc[f.name] = f.type === "select" ? f.options[0].value : "";
          }
          return acc;
        }, {})
      );
      if (onSuccess) onSuccess();
    },
  });

  function handleChange(e) {
    let value;

    if (e.target.type === "boolean") {
      // For boolean fields, the value is already converted by BooleanSelect
      value = e.target.value;
    } else if (e.target.type === "number") {
      value = e.target.value;
    } else {
      value = e.target.value;
    }

    setForm((f) => ({ ...f, [e.target.name]: value }));

    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  }

  function validateForm() {
    const newErrors = {};

    // Get visible fields based on editing mode
    const visibleFields = fields.filter((f) => !(editing ? f.hiddenEdit : f.hiddenCreate));

    visibleFields.forEach((field) => {
      if (field.required) {
        const value = form[field.name];

        // For boolean fields, only check if required and no value is set
        if (field.type === "bool") {
          if (value === null || value === undefined) {
            newErrors[field.name] = `${field.label} er påkrevet`;
          }
        }
        // For other fields, check if empty
        else if (value === null || value === undefined || value === "") {
          newErrors[field.name] = `${field.label} er påkrevet`;
        }
        // For select fields, check if it's a valid option
        else if (field.type === "select" && field.options) {
          const isValidOption = field.options.some((opt) => opt.value === value);
          if (!isValidOption) {
            newErrors[field.name] = `Velg en gyldig ${field.label.toLowerCase()}`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return; // Don't submit if validation fails
    }

    setIsSubmitting(true);

    if (editing) {
      updateMutation.mutate(
        { ...form, id: row.id },
        {
          onSettled: () => setIsSubmitting(false),
        }
      );
    } else {
      createMutation.mutate(form, {
        onSettled: () => setIsSubmitting(false),
      });
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4"></h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields
          .filter((f) => !(editing ? f.hiddenEdit : f.hiddenCreate))
          .map((field) => (
            <div key={field.name} className="space-y-2">
              {field.type === "bool" ? (
                <div>
                  <BooleanSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    defaultValue={field.default}
                    placeholder={field.placeholder}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.type === "select" ? (
                <>
                  <label className="block text-sm font-medium text-text-primary">
                    {field.label}
                    {field.required && <span className="text-error-500 ml-1">*</span>}
                  </label>
                  <select
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    className={`input-base ${errors[field.name] ? "input-error" : "input-default"}`}
                    required={field.required}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors[field.name] && (
                    <div className="flex items-center text-sm text-error-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </>
              ) : field.name === "enhetId" ? (
                <div>
                  <EnhetSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.name === "statusId" ? (
                <div>
                  <StatusSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.name === "kravreferansetypeID" ? (
                <div>
                  <KravreferansetypeSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.name === "vurderingId" ? (
                <div>
                  <VurderingSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.name === "emneId" ? (
                <div>
                  <EmneSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.name === "kravStatus" ? (
                <div>
                  <KravStatusSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.type === "number" ? (
                <div>
                  <NumberInput
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    integer={field.integer}
                    placeholder={field.placeholder}
                    hasError={!!errors[field.name]}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.type === "parentselect" ? (
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    {field.label}
                    {field.required && <span className="text-error-500 ml-1">*</span>}
                  </label>
                  <ParentSelectField
                    field={field}
                    value={form[field.name]}
                    onChange={(value) => setForm((f) => ({ ...f, [field.name]: value }))}
                    currentLevel={form.level || row?.level}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : field.type === "kravselect" ? (
                <div>
                  <KravSelect
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                    excludeId={row?.id} // Exclude current record ID when editing
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-text-primary">
                    {field.label}
                    {field.required && <span className="text-error-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={`input-base ${errors[field.name] ? "input-error" : "input-default"}`}
                    required={field.required}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors[field.name]}</span>
                    </div>
                  )}
                </>
              )}
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
