// Entity select components that can be used across models
import React from "react";
import { StatusSelect } from "../../ui/form/StatusSelect";
import { VurderingSelect } from "../../ui/form/VurderingSelect";
import { EmneSelect } from "../../ui/form/EmneSelect";
import { KravreferansetypeSelect } from "../../ui/form/Kravreferansetype";
import { PrioritetSelect } from "../../ui/form/PrioritetSelect";
import { KravSelect } from "../../ui/form/KravSelect";
import { KravStatusSelect } from "../../ui/form/EnumSelect";
import EnhetSelect from "../EnhetSelect";
import GenericMultiSelect from "../../ui/form/GenericMultiSelect";

// Import API endpoints for entity-specific multiselects
import { getLoverSimple as getLover, getKravpakkerSimple as getKravpakker } from "@/api/endpoints";

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

  emneselect: ({ field, value, onChange, error }) => (
    <EmneSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

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

  kravstatusselect: ({ field, value, onChange, error }) => (
    <KravStatusSelect name={field.name} value={value} onChange={onChange} label={field.label} required={field.required} />
  ),

  // Entity-aware multiselect that uses configuration
  multiselect: ({ field, value, onChange, error }) => {
    const entityType = field.entityType;
    const config = MULTISELECT_ENTITY_CONFIG[entityType];

    if (!config) {
      console.error(`Multiselect entityType "${entityType}" not found in configuration`);
      return <div>Error: Unknown multiselect type "{entityType}"</div>;
    }

    return (
      <GenericMultiSelect
        selectedValues={value || []}
        onSelectionChange={(values) => {
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
        placeholder={field.placeholder || config.placeholder}
        searchPlaceholder={config.searchPlaceholder}
        emptyMessage={config.emptyMessage}
        loadingMessage={config.loadingMessage}
      />
    );
  },
};
