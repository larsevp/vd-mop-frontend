// Import API endpoints for entity-specific multiselects
import { getLoverSimple as getLover, getKravpakkerSimple as getKravpakker, getKravSimple as getKrav, getProsjektKravSimple as getProsjektKrav } from "@/api/endpoints";

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
  prosjektKrav: {
    apiEndpoint: getProsjektKrav,
    valueField: "id",
    labelField: "tittel", // Will be overridden by custom formatter
    placeholder: "Velg prosjektkrav...",
    searchPlaceholder: "Søk etter prosjektkrav...",
    emptyMessage: "Ingen prosjektkrav funnet.",
    loadingMessage: "Laster prosjektkrav...",
    relationshipField: "prosjektKrav", // Field name in row data for relationships
    // Custom label formatter that includes prosjektKravUID
    customLabelFormatter: (item) => `${item.kravUID} - ${item.tittel}`,
    // Use the plain text snippet for description/tooltip
    descriptionField: "beskrivelseSnippet",
  },
};