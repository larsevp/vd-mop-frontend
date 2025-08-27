import React from "react";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";
import { ExpandableRichText } from "@/components/tableComponents/displayValues/ExpandableRichText.jsx";

/**
 * Generic unified field component that can handle both view and edit modes
 * for any model type. This provides consistent field rendering across all contexts.
 * 
 * @param {Object} props
 * @param {Object} props.field - Field configuration object
 * @param {*} props.value - Current field value
 * @param {Object} props.data - Complete entity data object
 * @param {string} props.mode - Mode: "view", "edit", or "create"
 * @param {Function} props.onChange - Change handler for edit modes
 * @param {string} props.error - Error message for validation
 * @param {Object} props.form - Form object reference
 * @param {string} props.modelName - Model name (e.g., "krav", "tiltak")
 * @param {string} props.className - Additional CSS classes
 */
const UnifiedField = ({ 
  field, 
  value, 
  data, 
  mode = "view", 
  onChange, 
  error, 
  form, 
  modelName, 
  className = "" 
}) => {
  const isEditing = mode === "edit" || mode === "create";

  if (isEditing) {
    // Use FieldResolver for edit modes
    const Component = FieldResolver.getFieldComponent(field, modelName);
    if (!Component) return null;

    // Handle different onChange signatures - some components pass synthetic events, others pass values directly
    const handleChange = (valueOrEvent) => {
      let actualValue;

      // Check if it's a synthetic event with target.value structure
      if (valueOrEvent && typeof valueOrEvent === "object" && valueOrEvent.target) {
        actualValue = valueOrEvent.target.value;
      } else {
        // Direct value
        actualValue = valueOrEvent;
      }

      onChange(actualValue);
    };

    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-neutral-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Component 
          field={field} 
          value={value} 
          onChange={handleChange} 
          error={error} 
          form={form} 
          row={data} 
          modelName={modelName} 
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Special handling for richtext fields in view mode
  if (field.type === "richtext" || field.type === "basicrichtext") {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="block text-sm font-medium text-neutral-700">{field.label}</label>
        <div className="text-neutral-900">
          {value ? (
            <ExpandableRichText content={value} maxLength={200} />
          ) : (
            <span className="text-neutral-500 italic">Ikke angitt</span>
          )}
        </div>
      </div>
    );
  }

  // Use DisplayValueResolver for other field types in view mode
  const displayValue = DisplayValueResolver.getDisplayComponent(data, field, "REACT", modelName);

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-neutral-700">{field.label}</label>
      <div className="text-neutral-900">
        {displayValue || <span className="text-neutral-500 italic">Ikke angitt</span>}
      </div>
    </div>
  );
};

export default UnifiedField;