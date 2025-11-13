import React from "react";
import { ChevronDown } from "lucide-react";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";
import InheritanceIndicator from "./InheritanceIndicator.jsx";

const FieldRenderer = ({ field, value, onChange, error, form, entity, modelName, isEditing, inheritanceInfo, hideLabel = false, isCollapsible = false, isExpanded = true, onToggle, availableEntities = [] }) => {
  // Check if this field should be hidden in view mode when empty
  const shouldHideInView = !isEditing && field.hideInViewIfEmpty && (!value || value === '' || (Array.isArray(value) && value.length === 0));

  // Early return if field should be hidden
  if (shouldHideInView) {
    return null;
  }

  const Component = FieldResolver.getFieldComponent(field, modelName);
  const componentHandlesOwnLabel = modelName && FieldResolver.getModelSpecificFields(modelName).fieldNames?.[field.name];

  // Determine if this specific field should be disabled due to inheritance
  const isFieldDisabledByInheritance = React.useMemo(() => {
    if (!inheritanceInfo || !isEditing) return false;

    // Check each field type for inheritance-based disabling
    switch (field.name) {
      case 'emneId':
      case 'emne':
        return inheritanceInfo.emneDisabled;

      case 'parentId':
      case 'parent':
        return inheritanceInfo.parentDisabled;

      case 'kravIds':
      case 'krav':
        return inheritanceInfo.kravDisabled;

      case 'prosjektKravIds':
      case 'prosjektKrav':
        return inheritanceInfo.kravDisabled;

      default:
        return false;
    }
  }, [field.name, inheritanceInfo, isEditing]);

  // Determine if we should show inheritance indicator for this field
  // MUST be called before any early returns to maintain hook order
  const showInheritanceIndicator = React.useMemo(() => {
    if (!inheritanceInfo || !isEditing) return false;
    // Only show for emne field when it's inherited
    return (field.name === 'emneId' || field.name === 'emne') && inheritanceInfo.isInherited;
  }, [field.name, inheritanceInfo, isEditing]);

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
        disabled={isFieldDisabledByInheritance}  // NEW: Pass disabled state
        availableEntities={availableEntities}  // NEW: Pass available entities for mentions
      />
    );
  }

  if (!isEditing) {
    // Special handling for fileupload fields - render the actual component in view mode
    // so users can view, download files (but not upload/delete)
    if (field.type === 'fileupload') {
      return (
        <div className="space-y-2">
          {!hideLabel && (
            <>
              {isCollapsible ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggle}
                    className="flex-1 flex items-center text-left hover:bg-slate-50/60 transition-all duration-200 py-2 pl-0 pr-2 rounded-lg gap-2 group"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 cursor-pointer">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>
                  <InfoIcon info={field.field_info} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <InfoIcon info={field.field_info} />
                </div>
              )}
            </>
          )}
          {isExpanded && (
            <Component
              field={field}
              value={value}
              onChange={onChange}
              error={error}
              form={form}
              row={entity}
              modelName={modelName}
              disabled={false}
              isEditing={false}  // Pass false to hide upload/delete buttons
              availableEntities={availableEntities}  // NEW: Pass available entities for mentions
            />
          )}
        </div>
      );
    }

    const displayValue = DisplayValueResolver.getDisplayComponent(
      entity,
      field,
      "DETAIL",
      modelName
    );

    // Check if this is a richtext field for special styling
    const isRichtextField = field.type === 'richtext' || field.type === 'basicrichtext';

    return (
      <div className="space-y-2">
        {!hideLabel && (
          <>
            {isCollapsible ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggle}
                  className="flex-1 flex items-center text-left hover:bg-slate-50/60 transition-all duration-200 py-2 pl-0 pr-2 rounded-lg gap-2 group"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 cursor-pointer">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
                <InfoIcon info={field.field_info} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <InfoIcon info={field.field_info} />
              </div>
            )}
            {/* Add divider below label for richtext fields (but not for collapsible fields) */}
            {isRichtextField && !isCollapsible && <div className="h-px bg-slate-200" />}
          </>
        )}
        {isExpanded && (
          <div className={`${isRichtextField && !hideLabel && !isCollapsible ? 'pt-2' : ''} text-base text-gray-900 leading-relaxed`}>
            {displayValue}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <>
          {isCollapsible ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggle}
                className="flex-1 flex items-center text-left hover:bg-slate-50/60 transition-all duration-200 py-2 pl-0 pr-2 rounded-lg gap-2 group"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 cursor-pointer">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>
              <InfoIcon info={field.field_info} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <InfoIcon info={field.field_info} />
            </div>
          )}
        </>
      )}
      {isExpanded && (
        <>
          <Component
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            form={form}
            row={entity}
            modelName={modelName}
            disabled={isFieldDisabledByInheritance}
            isEditing={isEditing}  // Pass edit mode to components
            availableEntities={availableEntities}  // NEW: Pass available entities for mentions
          />
          {showInheritanceIndicator && (
            <InheritanceIndicator
              source={inheritanceInfo.source}
              sourceData={inheritanceInfo.sourceData}
            />
          )}
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600 font-normal">
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FieldRenderer;