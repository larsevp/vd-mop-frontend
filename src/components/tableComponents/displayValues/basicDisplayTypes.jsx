// Basic display value handlers for common field types
import React from "react";
import { booleanToJaNei } from "../../../utils/booleanParser";
import { IconWithText } from "../../ui/DynamicIcon";

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
    const value = row[field.name];
    const displayValue = value !== null && value !== undefined ? value : "N/A";

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
};
