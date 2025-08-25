import { booleanToJaNei } from "../../../utils/booleanParser";

// Define the enum for the 'from' parameter
export enum FieldSource {
  LIST = "LIST",
  EDIT = "EDIT",
  CREATE = "CREATE",
}

// Translation mappings for enum fields
const kravStatusTranslations: { [key: string]: string } = {
  draft: "Kladd",
  baseline: "Gjeldende versjon",
  changed: "Endret",
  deprecated: "Utgår",
};

export const displayFieldValue_old = (row: any, field: any, from: FieldSource | null = null, queryKey: any[] | null = null): string => {
  // If the field has a computed property, evaluate it and return the result
  if (field.computed) {
    try {
      return field.computed(row); // Safely evaluate the computed function
    } catch (error) {
      console.error(`Error evaluating computed field "${field.name}":`, error);
      return "N/A"; // Fallback in case of errors
    }
  }

  const value = row[field.name];
  //Henter ut første definerte modelQueryKey fra modelConfig.json
  // Ensure queryKey is an array and has elements before accessing the first element
  const modelQueryKey = Array.isArray(queryKey) && queryKey.length > 0 ? queryKey[0] : undefined;
  if (field.name === "navn" && row.hasOwnProperty("level") && from === "LIST" && modelQueryKey === "enheter") {
    // Check if level exists on the field
    const level = row.level !== undefined && row.level !== null ? Number(row.level) || 0 : 0;

    //return "\u00A0".repeat(3 * level) + value;
    return "-".repeat(1 * level) + " " + value;
  }

  // Handle enhetId specially - show the related enhet name if available
  if (field.name === "enhetId") {
    if (row.enhet && row.enhet.navn) {
      return row.enhet.navn;
    } else if (value) {
      return `Enhet ID: ${value}`; // Fallback to showing the ID if name not available
    } else {
      return "Ingen enhet"; // No enhet assigned
    }
  }

  // Handle User foreign keys
  if (field.name === "createdBy") {
    if (row.creator && row.creator.navn) {
      return row.creator.navn;
    } else if (value) {
      return `User ID: ${value}`;
    } else {
      return "System";
    }
  }

  if (field.name === "updatedBy") {
    if (row.updater && row.updater.navn) {
      return row.updater.navn;
    } else if (value) {
      return `User ID: ${value}`;
    } else {
      return "Ingen oppdateringer";
    }
  }

  // Handle Emne foreign keys
  if (field.name === "emneId") {
    if (row.emne && (row.emne.tittel || row.emne.navn)) {
      return row.emne.tittel || row.emne.navn;
    } else if (value) {
      return `Emne ID: ${value}`;
    } else {
      return "Ingen emne";
    }
  }

  // Handle kravStatus enum translation
  if (field.name === "kravStatus") {
    if (value && kravStatusTranslations[value]) {
      return kravStatusTranslations[value];
    } else if (value) {
      return value; // Fallback to raw value if no translation found
    } else {
      return "Ingen status";
    }
  }

  // Handle statusId specially - show the related status name if available
  if (field.name === "statusId") {
    if (row.status && row.status.navn) {
      // If there's an icon, we could prefix it as text for simple display
      // For React components, use displayFieldValueWithIcon instead
      return row.status.icon
        ? `${row.status.navn}` // Keep text-only for basic display
        : row.status.navn;
    } else if (value) {
      return `Status ID: ${value}`;
    } else {
      return "Ingen status";
    }
  }

  // Handle vurderingId specially - show the related vurdering title if available
  if (field.name === "vurderingId") {
    if (row.vurdering && row.vurdering.tittel) {
      return row.vurdering.icon
        ? `${row.vurdering.tittel}` // Keep text-only for basic display
        : row.vurdering.tittel;
    } else if (value) {
      return `Vurdering ID: ${value}`;
    } else {
      return "Ingen vurdering";
    }
  }

  // Handle parentId specially - show the related parent name if available
  if (field.name === "parentId") {
    if (row.parent && row.parent.navn) {
      return row.parent.navn;
    } else if (value) {
      return `Parent ID: ${value}`;
    } else {
      return "Ingen parent";
    }
  }

  // Handle boolean fields with type "bool"
  if (field.type === "bool") {
    return booleanToJaNei(value, "Ikke angitt");
  }

  // Handle richtext fields - strip HTML and truncate for display
  if (field.type === "richtext") {
    if (!value) return "Ingen innhold";

    // Strip HTML tags and get plain text
    const textContent = value.replace(/<[^>]*>/g, "").trim();

    // Truncate for list view
    if (from === FieldSource.LIST) {
      return textContent.length > 100 ? textContent.substring(0, 97) + "..." : textContent || "Ingen innhold";
    }

    return textContent || "Ingen innhold";
  }

  // Default: return the raw value, or 'N/A' if null/undefined
  return value !== null && value !== undefined ? value : "N/A";
};
