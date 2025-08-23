// Model-specific field configurations
// This allows for model-specific overrides and custom field handling

import React from "react";
import { KravSelect } from "../../ui/form/KravSelect";
import ParentSelectField from "../ParentSelectField";

export const MODEL_SPECIFIC_FIELDS = {
  // Krav model specific field configurations
  krav: {
    // Field name specific configurations
    fieldNames: {
      // No field name specific overrides for Krav currently
      // parentId now uses the standard kravselect type with RowForm handling labels
    },

    // Field type overrides for this model
    fieldTypes: {
      // Override kravselect behavior for Krav model to add hierarchy prevention
      kravselect: ({ field, value, onChange, error, row }) => (
        <KravSelect
          name={field.name}
          value={value}
          onChange={onChange}
          label={field.label}
          required={field.required}
          placeholder={field.placeholder || "Underkrav av annet krav?"}
          excludeId={row?.id}
          allowEmpty={!field.required}
          emptyLabel="Ingen tilhørlighet"
        />
      ),
    },
  },

  // Enhet model specific configurations
  enhet: {
    fieldNames: {
      // Parent selection for Enhet - uses ParentSelectField with level-based logic
      parentId: ({ field, value, onChange, error, form, row }) => (
        <>
          <label className="block text-sm font-medium text-text-primary">
            {field.label}
            {field.required && <span className="text-error-500 ml-1">*</span>}
          </label>
          <ParentSelectField
            field={field}
            value={value}
            onChange={(val) => onChange({ target: { name: field.name, value: val, type: "select" } })}
            currentLevel={form?.level || row?.level}
          />
        </>
      ),
    },
    fieldTypes: {},
  },

  // Example: User model specific configurations
  user: {
    fieldNames: {
      // email: ({ field, value, onChange, error }) => (
      //   <CustomEmailComponent />
      // ),
    },
    fieldTypes: {},
  },

  // Example: Project model specific configurations
  prosjekt: {
    fieldNames: {},
    fieldTypes: {},
  },

  // Add more models as needed...
};

// Model-specific validation rules
export const MODEL_VALIDATION_RULES = {
  krav: {
    // Custom validation for specific fields in Krav model
    tittel: (value) => {
      if (value && value.length < 3) {
        return "Tittel må være minst 3 tegn";
      }
      return null;
    },
    // versjon: (value) => {
    //   if (value && !/^\d+\.\d+$/.test(value)) {
    //     return "Versjon må være i format X.Y (f.eks. 1.0)";
    //   }
    //   return null;
    // },
  },

  user: {
    // email: (value) => {
    //   if (value && !value.includes('@')) {
    //     return "Ugyldig e-postadresse";
    //   }
    //   return null;
    // },
  },
};
