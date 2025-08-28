// Entity select components that can be used across models
import React, { useEffect, useRef } from "react";
import { StatusSelect } from "../../ui/form/StatusSelect";
import { VurderingSelect } from "../../ui/form/VurderingSelect";
import { EmneSelect } from "../../ui/form/EmneSelect";
import { KravreferansetypeSelect } from "../../ui/form/Kravreferansetype";
import { PrioritetSelect } from "../../ui/form/PrioritetSelect";
import { KravSelect } from "../../ui/form/KravSelect";
import { TiltakSelect } from "../../ui/form/TiltakSelect";
import { KravStatusSelect } from "../../ui/form/EnumSelect";
import EnhetSelect from "../EnhetSelect";
import GenericMultiSelect from "../../ui/form/GenericMultiSelect";

// Import API endpoints for entity-specific multiselects
import { getLoverSimple as getLover, getKravpakkerSimple as getKravpakker, getKravSimple as getKrav } from "@/api/endpoints";

// Configuration mapping for multiselect entities
export const MULTISELECT_ENTITY_CONFIG = {
  lov: {
    apiEndpoint: getLover,
    valueField: "id",
    labelField: "tittel",
    placeholder: "Velg lover...",
    searchPlaceholder: "Søk etter lover...",
    emptyMessage: "Ingen lover funnet.",
    loadingMessage: "Laster lover...",
    relationshipField: "lover", // Field name in row data for relationships
  },
  kravpakker: {
    apiEndpoint: getKravpakker,
    valueField: "id",
    labelField: "tittel",
    placeholder: "Velg kravpakker...",
    searchPlaceholder: "Søk etter kravpakker...",
    emptyMessage: "Ingen kravpakker funnet.",
    loadingMessage: "Laster kravpakker...",
    relationshipField: "kravpakker", // Field name in row data for relationships
  },
  krav: {
    apiEndpoint: getKrav,
    valueField: "id",
    labelField: "tittel", // Will be overridden by custom formatter
    placeholder: "Velg krav...",
    searchPlaceholder: "Søk etter krav...",
    emptyMessage: "Ingen krav funnet.",
    loadingMessage: "Laster krav...",
    relationshipField: "krav", // Field name in row data for relationships
    // Custom label formatter that includes kravUID
    customLabelFormatter: (item) => `${item.kravUID} - ${item.tittel}`,
    // Use the plain text snippet for description/tooltip
    descriptionField: "beskrivelseSnippet",
  },
};

export const ENTITY_FIELD_TYPES = {
  // Global entity selects (can be used in any model)
  statusselect: ({ field, value, onChange, error }) => (
    <StatusSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  vurderingselect: ({ field, value, onChange, error }) => (
    <VurderingSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  emneselect: ({ field, value, onChange, error, formData, form, row, data }) => {
    // Enhanced approach: check multiple data sources for krav
    const currentData = formData || form || row || data || {};

    // Function to extract krav data from any available source
    const getKravData = () => {
      // Check direct krav property
      if (currentData.krav && Array.isArray(currentData.krav)) {
        return currentData.krav;
      }

      // Check if we have access to the full tiltak object through different props
      const sources = [formData, form, row, data].filter(Boolean);

      for (const source of sources) {
        if (source.krav && Array.isArray(source.krav)) {
          return source.krav;
        }

        // Also check for nested krav in any object properties
        const keys = Object.keys(source);
        for (const key of keys) {
          if (source[key] && typeof source[key] === "object" && source[key].krav && Array.isArray(source[key].krav)) {
            return source[key].krav;
          }
        }
      }

      return [];
    };

    const kravData = getKravData();
    const hasKrav = kravData.length > 0;
    const hasCleared = useRef(false);

    // Use useEffect to clear emneId when krav exist, but only once
    useEffect(() => {
      if (hasKrav && value && !hasCleared.current) {
        hasCleared.current = true;
        onChange({
          target: {
            name: field.name,
            value: null,
            type: "select",
          },
        });
      }
      // Reset the flag if krav are removed
      if (!hasKrav) {
        hasCleared.current = false;
      }
    }, [hasKrav, value, onChange, field.name]);

    return (
      <EmneSelect
        name={field.name}
        value={hasKrav ? null : value}
        onChange={hasKrav ? () => {} : onChange}
        label={field.label}
        required={field.required && !hasKrav}
        placeholder={hasKrav ? "Emne er deaktivert når krav er valgt" : field.placeholder}
        disabled={hasKrav}
      />
    );
  },
  enhetselect: ({ field, value, onChange, error }) => (
    <EnhetSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  // Model-specific entity selects
  kravreferansetypeselect: ({ field, value, onChange, error }) => (
    <KravreferansetypeSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  prioritetselect: ({ field, value, onChange, error }) => (
    <PrioritetSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  kravselect: ({ field, value, onChange, error, row }) => (
    <KravSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
      excludeId={row?.id}
    />
  ),

  tiltakselect: ({ field, value, onChange, error, row }) => (
    <TiltakSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
      excludeId={row?.id}
    />
  ),

  kravstatusselect: ({ field, value, onChange, error }) => (
    <KravStatusSelect name={field.name} value={value} onChange={onChange} label={field.label} required={field.required} />
  ),

  // Entity-aware multiselect that uses configuration
  multiselect: ({ field, value, onChange, error, row, formData, form, setFormData }) => {
    const entityType = field.entityType;
    const config = MULTISELECT_ENTITY_CONFIG[entityType];

    // Use formData if available, fallback to form (for different component contexts)
    const currentFormData = formData || form;

    if (!config) {
      console.error(`Multiselect entityType "${entityType}" not found in configuration`);
      return <div>Error: Unknown multiselect type "{entityType}"</div>;
    }

    // Transform value: if it's an array of objects (relationship data), extract IDs
    // if it's already an array of IDs, use as-is
    let selectedValues = [];
    let actualValue = value;

    // If value is undefined/null but we have row data, try to get the relationship data from row
    if (!actualValue && row && config.relationshipField) {
      // Try to find relationship data using the configured relationship field name
      const relationshipData = row[config.relationshipField];
      if (relationshipData && Array.isArray(relationshipData)) {
        actualValue = relationshipData;
      }
    }

    if (Array.isArray(actualValue)) {
      if (actualValue.length > 0 && typeof actualValue[0] === "object" && actualValue[0] !== null) {
        // Array of objects - extract IDs using the configured valueField
        selectedValues = actualValue.map((item) => item[config.valueField]);
      } else {
        // Array of primitives (IDs) - use as-is
        selectedValues = actualValue;
      }
    }

    return (
      <GenericMultiSelect
        selectedValues={selectedValues}
        onSelectionChange={(values) => {
          // Handle the business rule for krav field
          if (field.name === "krav" && entityType === "krav") {
            console.log("[DEBUG] Krav selection changed:", { values, hasValues: values && values.length > 0 });

            // If krav are selected, clear emne
            if (values && values.length > 0) {
              console.log("[DEBUG] Clearing emneId because krav are selected");
              if (row) {
                row.emneId = null;
              }
              if (currentFormData) {
                currentFormData.emneId = null;
              }
            }
            // Note: We don't restore emne when krav are cleared - user must manually select emne
          }

          // Standard onChange handling
          onChange({
            target: {
              name: field.name,
              value: values,
              type: "multiselect",
            },
          });
        }}
        disabled={field.disabled}
        className={field.className}
        apiEndpoint={config.apiEndpoint}
        valueField={config.valueField}
        labelField={config.labelField}
        customLabelFormatter={config.customLabelFormatter}
        descriptionField={config.descriptionField}
        placeholder={field.placeholder || config.placeholder}
        searchPlaceholder={config.searchPlaceholder}
        emptyMessage={config.emptyMessage}
        loadingMessage={config.loadingMessage}
      />
    );
  },
};
