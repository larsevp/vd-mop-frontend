import React from "react";
import { EmneSelect } from "../../../ui/form/EmneSelect";

export const emneSelectType = {
  emneselect: ({ field, value, onChange, error, disabled }) => {
    // Simple emneSelect component - inheritance logic handled by parent (EntityDetailPane)
    // For TableComponents: No complex inheritance needed (as per architecture decision)
    // For EntityWorkspace: Inheritance managed by EntityDetailPane + adapters

    return (
      <EmneSelect
        name={field.name}
        value={value || null}
        onChange={onChange}
        label={field.label}
        required={field.required}
        placeholder={field.placeholder}
        disabled={disabled || false}
        error={error}
      />
    );
  },
};
