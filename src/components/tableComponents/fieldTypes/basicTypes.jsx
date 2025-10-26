// Basic field type components that work across all models
import React from "react";
import { BooleanSelect } from "@/components/ui/form/BooleanSelect";
import NumberInput from "../NumberInput";
import { TiptapEditor } from "@/components/ui/editor/TiptapEditor";
import { FileUpload } from "@/components/forms";
import ColorPicker from "@/components/ui/form/ColorPicker";
import { IconPicker } from "@/components/ui/icon-picker/icon-picker";

export const BASIC_FIELD_TYPES = {
  text: ({ field, value, onChange, error }) => (
    <input
      type="text"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  textarea: ({ field, value, onChange, error }) => (
    <textarea
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      rows={field.rows || 3}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  number: ({ field, value, onChange, error }) => (
    <NumberInput
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      min={field.min}
      max={field.max}
      step={field.step}
      integer={field.integer}
      placeholder={field.placeholder}
      hasError={!!error}
    />
  ),

  bool: ({ field, value, onChange, error }) => (
    <BooleanSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      defaultValue={field.default}
      placeholder={field.placeholder}
    />
  ),

  select: ({ field, value, onChange, error }) => (
    <select
      name={field.name}
      value={value || ""}
      onChange={onChange}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    >
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),

  email: ({ field, value, onChange, error }) => (
    <input
      type="email"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  password: ({ field, value, onChange, error }) => (
    <input
      type="password"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  color: ({ field, value, onChange, error }) => (
    <ColorPicker name={field.name} value={value} onChange={onChange} error={error} placeholder={field.placeholder || "Velg farge..."} />
  ),

  icon: ({ field, value, onChange, error }) => {
    // Convert kebab-case to PascalCase for storage
    const kebabToPascalCase = (str) => {
      if (!str) return str;
      return str
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
    };

    // Convert PascalCase back to kebab-case for the IconPicker display
    const pascalToKebabCase = (str) => {
      if (!str) return str;
      return str
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, ""); // Remove leading dash
    };

    const handleIconChange = (iconName) => {
      // Convert from kebab-case (IconPicker format) to PascalCase (storage format)
      const pascalCaseValue = kebabToPascalCase(iconName);

      const syntheticEvent = {
        target: {
          name: field.name,
          value: pascalCaseValue,
          type: "icon",
        },
      };
      onChange(syntheticEvent);
    };

    // Convert stored PascalCase back to kebab-case for IconPicker display
    const displayValue = pascalToKebabCase(value);

    return (
      <IconPicker
        value={displayValue}
        onValueChange={handleIconChange}
        searchPlaceholder={field.placeholder || "Søk etter ikon..."}
        triggerPlaceholder={field.placeholder || "Velg ikon"}
        categorized={true}
        searchable={true}
      />
    );
  },

  date: ({ field, value, onChange, error }) => (
    <input
      type="date"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  datetime: ({ field, value, onChange, error }) => (
    <input
      type="datetime-local"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  richtext: ({ field, value, onChange, error }) => {
    const handleEditorChange = (html) => {
      // Create a synthetic event to match the expected onChange signature
      const syntheticEvent = {
        target: {
          name: field.name,
          value: html,
          type: "richtext",
        },
      };
      onChange(syntheticEvent);
    };

    return (
      <TiptapEditor
        value={value || ""}
        onChange={handleEditorChange}
        placeholder={field.placeholder || "Start typing..."}
        error={!!error}
        disabled={field.disabled}
        uploadUrl={field.uploadUrl} // Future backend integration
      />
    );
  },

  basicrichtext: ({ field, value, onChange, error }) => {
    const handleEditorChange = (html) => {
      const syntheticEvent = {
        target: {
          name: field.name,
          value: html,
          type: "basicrichtext",
        },
      };
      onChange(syntheticEvent);
    };

    return (
      <TiptapEditor
        value={value || ""}
        onChange={handleEditorChange}
        placeholder={field.placeholder || "Skriv beskrivelse..."}
        error={!!error}
        disabled={field.disabled}
        basic={true}
      />
    );
  },

  fileupload: ({ field, value, onChange, error, row, modelName, isEditing }) => {
    return (
      <FileUpload
        modelType={modelName}
        modelId={row?.id}
        label={field.label}
        showUpload={isEditing !== false}  // Hide upload/delete buttons in view mode
        onFilesChange={() => {
          // Trigger a form refresh if needed
          const syntheticEvent = {
            target: {
              name: field.name,
              value: Date.now(), // Just trigger a change to refresh
              type: "fileupload",
            },
          };
          onChange && onChange(syntheticEvent);
        }}
      />
    );
  },
};
