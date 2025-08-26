// Basic display value handlers for common field types
import React from "react";
import { booleanToJaNei } from "../../../utils/booleanParser";
import { IconWithText } from "../../ui/DynamicIcon";
import { ExpandableRichText } from "./ExpandableRichText";

export const BASIC_DISPLAY_TYPES = {
  // Boolean fields

  bool: (row, field, context) => {
    const value = row[field.name];
    const displayValue = booleanToJaNei(value, "Ikke angitt");

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // Text fields
  text: (row, field, context) => {
    //console.log(field);
    const value = row[field.name];
    let displayValue = value !== null && value !== undefined ? value : "N/A";

    // Handle objects by trying to extract a meaningful display value
    if (typeof displayValue === "object" && displayValue !== null) {
      // Try common name fields for objects
      displayValue =
        displayValue.tittel ||
        displayValue.navn ||
        displayValue.name ||
        displayValue.kravUID ||
        displayValue.tiltakUID ||
        displayValue.id ||
        JSON.stringify(displayValue);
    }

    const { truncate } = field;

    if (truncate && typeof truncate === "number" && typeof displayValue === "string" && displayValue.length > truncate) {
      displayValue = `${displayValue.substring(0, truncate)}...`;
    }

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // String fields (alias for text)
  string: (row, field, context) => {
    const value = row[field.name];
    const displayValue = value !== null && value !== undefined ? value : "N/A";

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // Number fields
  number: (row, field, context) => {
    const value = row[field.name];
    const displayValue = value !== null && value !== undefined ? value.toString() : "N/A";

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // Date fields
  date: (row, field, context) => {
    const value = row[field.name];
    if (!value) {
      const displayValue = "N/A";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    try {
      const displayValue = new Date(value).toLocaleDateString("nb-NO");
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } catch (error) {
      const displayValue = value.toString();
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Datetime fields
  datetime: (row, field, context) => {
    const value = row[field.name];
    if (!value) {
      const displayValue = "N/A";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    try {
      const displayValue = new Date(value).toLocaleString("nb-NO");
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } catch (error) {
      const displayValue = value.toString();
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Rich text fields
  richtext: (row, field, context) => {
    const value = row[field.name];
    if (!value) {
      const displayValue = "N/A";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    if (context.format === "REACT") {
      // Use ExpandableRichText for React display in lists
      return <ExpandableRichText content={value} maxLength={100} />;
    }

    // For string format, strip HTML tags and return plain text
    const plainText = value.replace(/<[^>]*>/g, "").trim();
    return plainText || "N/A";
  },

  // Basic rich text fields (alias for richtext)
  basicrichtext: (row, field, context) => {
    return BASIC_DISPLAY_TYPES.richtext(row, field, context);
  },

  // File upload field display
  fileupload: (row, field, context) => {
    if (context.format === "REACT") {
      return <span className="text-sm text-gray-500">Se filer i redigeringsvisning</span>;
    }
    return "Filer";
  },
};
