import React from "react";
import { KravSelect } from "../../../ui/form/KravSelect";
import { TiltakSelect } from "../../../ui/form/TiltakSelect";
import { ProsjektKravSelect } from "../../../ui/form/ProsjektKravSelect";
import { ProsjektTiltakSelect } from "../../../ui/form/ProsjektTiltakSelect";

// General entity relationship selects (can be used across models)
// Simplified - inheritance/mutual exclusivity handled by EntityDetailPane for EntityWorkspace
// TableComponents don't need complex inheritance logic
export const entityRelationshipSelects = {
  kravselect: ({ field, value, onChange, error, row, disabled: propDisabled }) => {
    return (
      <KravSelect
        name={field.name}
        value={value}
        onChange={onChange}
        label={field.label}
        required={field.required}
        placeholder={field.placeholder}
        excludeId={row?.id}
        disabled={propDisabled || field.disabled || false}
        error={error}
      />
    );
  },

  prosjektKravselect: ({ field, value, onChange, error, row, disabled: propDisabled }) => {
    return (
      <ProsjektKravSelect
        name={field.name}
        value={value}
        onChange={onChange}
        label={field.label}
        required={field.required}
        placeholder={field.placeholder}
        excludeId={row?.id}
        disabled={propDisabled || field.disabled || false}
        error={error}
      />
    );
  },

  tiltakselect: ({ field, value, onChange, error, row, disabled: propDisabled }) => {
    return (
      <TiltakSelect
        name={field.name}
        value={value}
        onChange={onChange}
        label={field.label}
        required={field.required}
        placeholder={field.placeholder}
        excludeId={row?.id}
        disabled={propDisabled || field.disabled || false}
        error={error}
      />
    );
  },

  prosjektTiltakselect: ({ field, value, onChange, error, row, disabled: propDisabled }) => {
    return (
      <ProsjektTiltakSelect
        name={field.name}
        value={value}
        onChange={onChange}
        label={field.label}
        required={field.required}
        placeholder={field.placeholder}
        excludeId={row?.id}
        disabled={propDisabled || field.disabled || false}
        error={error}
      />
    );
  },
};
