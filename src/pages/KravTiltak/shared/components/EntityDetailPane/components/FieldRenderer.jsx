import React from "react";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";

const FieldRenderer = ({ field, value, onChange, error, form, entity, modelName, isEditing }) => {
  const Component = FieldResolver.getFieldComponent(field, modelName);
  const componentHandlesOwnLabel = modelName && FieldResolver.getModelSpecificFields(modelName).fieldNames?.[field.name];

  if (componentHandlesOwnLabel) {
    return (
      <Component
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        form={form}
        row={entity}
        modelName={modelName}
      />
    );
  }

  if (!isEditing) {
    const displayValue = DisplayValueResolver.getDisplayComponent(
      entity,
      field,
      "DETAIL",
      modelName
    );

    return (
      <div className="mb-6">
        <div className="flex items-center gap-1 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <InfoIcon info={field.field_info} />
        </div>
        <div className="text-gray-900">
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <InfoIcon info={field.field_info} />
      </div>
      <Component
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        form={form}
        row={entity}
        modelName={modelName}
      />
      {error && (
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
      )}
    </div>
  );
};

export default FieldRenderer;