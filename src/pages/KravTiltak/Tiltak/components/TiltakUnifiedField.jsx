import React from "react";
import UnifiedField from "../../shared/UnifiedField.jsx";

/**
 * Tiltak-specific unified field component that wraps the generic UnifiedField
 * This provides consistent field rendering across all Tiltak contexts
 */
const TiltakUnifiedField = ({ field, value, data, mode = "view", onChange, error, form, className = "" }) => {
  return (
    <UnifiedField
      field={field}
      value={value}
      data={data}
      mode={mode}
      onChange={onChange}
      error={error}
      form={form}
      modelName="tiltak"
      className={className}
    />
  );
};

export default TiltakUnifiedField;