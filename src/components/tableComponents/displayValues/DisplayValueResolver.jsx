// Main display value resolver with priority-based resolution
import React from "react";
import { BASIC_DISPLAY_TYPES } from "./basicDisplayTypes.jsx";
import { ENTITY_DISPLAY_TYPES } from "./entityDisplayTypes.jsx";
import { MODEL_SPECIFIC_DISPLAY } from "./modelSpecificDisplay.jsx";

/**
 * Display value resolution priority:
 * 1. Model-specific field name override (highest priority)
 * 2. Model-specific field type override
 * 3. Computed field evaluation
 * 4. Global entity field type (foreign key fields - fallback)
 * 5. Basic field type
 * 6. Fallback to default text display (lowest priority)
 */
export class DisplayValueResolver {
  /**
   * Resolve display value for a field
   * @param {Object} row - Data row object
   * @param {Object} field - Field configuration object
   * @param {Object} context - Display context with source, format, and modelName
   * @returns {string|React.Element} - Display value (string for LIST, React element for REACT format)
   */
  static resolveDisplayValue(row, field, context = {}) {
    // Set default context values
    const resolveContext = {
      source: context.source || "LIST", // LIST, EDIT, CREATE
      format: context.format || "STRING", // STRING, REACT
      modelName: context.modelName || null,
      queryKey: context.queryKey || null,
      ...context,
    };

    const modelConfig = MODEL_SPECIFIC_DISPLAY[resolveContext.modelName];

    // 1. Check for model-specific field name override (highest priority)
    if (modelConfig?.fieldNames?.[field.name]) {
      return modelConfig.fieldNames[field.name](row, field, resolveContext);
    }

    // 2. Check for model-specific field type override
    if (modelConfig?.fieldTypes?.[field.type]) {
      return modelConfig.fieldTypes[field.type](row, field, resolveContext);
    }

    // 3. Check for computed field
    if (field.computed) {
      try {
        const computedValue = field.computed(row);
        return resolveContext.format === "REACT" ? <span>{computedValue}</span> : computedValue;
      } catch (error) {
        console.error(`Error evaluating computed field "${field.name}":`, error);
        const fallbackValue = "N/A";
        return resolveContext.format === "REACT" ? <span>{fallbackValue}</span> : fallbackValue;
      }
    }

    // 4. Check for global entity field type (foreign keys) - fallback
    if (ENTITY_DISPLAY_TYPES[field.name]) {
      return ENTITY_DISPLAY_TYPES[field.name](row, field, resolveContext);
    }

    // 5. Check for basic field type
    if (BASIC_DISPLAY_TYPES[field.type]) {
      return BASIC_DISPLAY_TYPES[field.type](row, field, resolveContext);
    }

    // 6. Fallback to default text display
    return BASIC_DISPLAY_TYPES.text(row, field, resolveContext);
  }

  /**
   * Convenience method for string display (backwards compatibility)
   */
  static getDisplayString(row, field, source = "LIST", modelName = null, queryKey = null) {
    return this.resolveDisplayValue(row, field, {
      source,
      format: "STRING",
      modelName,
      queryKey,
    });
  }

  /**
   * Convenience method for React component display with icons
   */
  static getDisplayComponent(row, field, source = "LIST", modelName = null, queryKey = null) {
    return this.resolveDisplayValue(row, field, {
      source,
      format: "REACT",
      modelName,
      queryKey,
    });
  }
}
