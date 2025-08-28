import React from "react";
import UnifiedField from "../../shared/UnifiedField.js";

/**
 * Krav-specific unified field component that wraps the generic UnifiedField
 * This provides consistent field rendering across all Krav contexts
 */
const KravUnifiedField = ({ field, value, data, mode = "view", onChange, error, form, className = "" }) => {
  return (
    <UnifiedField
      field={field}
      value={value}
      data={data}
      mode={mode}
      onChange={onChange}
      error={error}
      form={form}
      modelName="krav"
      className={className}
    />
  );
};

export default KravUnifiedField;
