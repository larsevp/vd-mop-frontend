// Main field configuration resolver
import { BASIC_FIELD_TYPES } from "./basicTypes.jsx";
import { ENTITY_FIELD_TYPES, MULTISELECT_ENTITY_CONFIG } from "./entityTypes.jsx";
import { MODEL_SPECIFIC_FIELDS, MODEL_VALIDATION_RULES } from "./modelSpecific.jsx";

/**
 * Field resolution priority:
 * 1. Model-specific field name override (highest priority)
 * 2. Model-specific field type override
 * 3. Global entity field type
 * 4. Basic field type
 * 5. Fallback to text input (lowest priority)
 */
export class FieldResolver {
  static getFieldComponent(field, modelName) {
    const modelConfig = MODEL_SPECIFIC_FIELDS[modelName];

    // 1. Check for model-specific field name override
    if (modelConfig?.fieldNames?.[field.name]) {
      return modelConfig.fieldNames[field.name];
    }

    // 2. Check for model-specific field type override
    if (modelConfig?.fieldTypes?.[field.type]) {
      return modelConfig.fieldTypes[field.type];
    }

    // 3. Check for global entity field type
    if (ENTITY_FIELD_TYPES[field.type]) {
      return ENTITY_FIELD_TYPES[field.type];
    }

    // 4. Check for basic field type
    if (BASIC_FIELD_TYPES[field.type]) {
      return BASIC_FIELD_TYPES[field.type];
    }

    // 5. Fallback to text input
    return BASIC_FIELD_TYPES.text;
  }

  static validateField(field, value, modelName) {
    const modelValidation = MODEL_VALIDATION_RULES[modelName];

    // Check for model-specific validation
    if (modelValidation?.[field.name]) {
      return modelValidation[field.name](value);
    }

    // Default validation (required fields)
    if (field.required) {
      if (field.type === "bool") {
        if (value === null || value === undefined) {
          return `${field.label} er påkrevet`;
        }
      } else if (field.type === "multiselect") {
        // Generic multiselect validation - check if array has at least one item
        if (!Array.isArray(value) || value.length === 0) {
          return `${field.label} er påkrevet`;
        }
      } else if (field.type === "richtext") {
        // Richtext validation - check if content is empty (ignoring empty HTML tags)
        const textContent = value?.replace(/<[^>]*>/g, "").trim();
        if (!textContent) {
          return `${field.label} er påkrevet`;
        }
      } else if (field.type === "fileupload") {
        // File upload fields are never required in the traditional sense
        // since files are stored separately and linked via scoped relationships
        return null;
      } else if (value === null || value === undefined || value === "") {
        return `${field.label} er påkrevet`;
      } else if (field.type === "select" && field.options) {
        const isValidOption = field.options.some((opt) => opt.value === value);
        if (!isValidOption) {
          return `Velg en gyldig ${field.label.toLowerCase()}`;
        }
      }
    }

    return null; // No error
  }

  /**
   * Initialize field value based on field type and existing data
   * @param {Object} field - Field configuration
   * @param {Object} row - Existing data (for editing)
   * @param {boolean} editing - Whether this is an edit operation
   * @param {string} modelName - Model name for model-specific initialization
   * @returns {any} - Initial value for the field
   */
  static initializeFieldValue(field, row, editing, modelName) {
    // Handle boolean fields
    if (field.type === "bool") {
      if (field.default !== undefined) {
        return field.default;
      }
      if (editing && row && row[field.name] !== undefined) {
        return row[field.name];
      }
      return null;
    }

    // Handle select fields with options
    if (field.type === "select" && field.options) {
      if (editing && row && row[field.name] !== undefined) {
        return row[field.name];
      }
      return field.options[0]?.value || "";
    }

    // Handle multiselect fields - transform relationship objects to ID arrays
    if (field.type === "multiselect") {
      if (editing && row && field.entityType) {
        const config = MULTISELECT_ENTITY_CONFIG[field.entityType];
        if (config && row[config.relationshipField]) {
          return Array.isArray(row[config.relationshipField]) ? row[config.relationshipField].map((item) => item[config.valueField]) : [];
        }
      }
      return [];
    }

    // Handle richtext fields
    if (field.type === "richtext") {
      if (editing && row && row[field.name] !== undefined) {
        return row[field.name];
      }
      return "";
    }

    // Handle fileupload fields
    if (field.type === "fileupload") {
      // File upload fields don't have a traditional form value
      // Files are managed separately via the FileUpload component
      return null;
    }

    // Handle default fields
    if (editing && row && row[field.name] !== undefined) {
      return row[field.name];
    }

    return "";
  }

  /**
   * Reset field value to default state (used after successful creation)
   * @param {Object} field - Field configuration
   * @param {string} modelName - Model name for model-specific reset logic
   * @returns {any} - Reset value for the field
   */
  static resetFieldValue(field, modelName) {
    if (field.type === "bool") {
      return field.default !== undefined ? field.default : null;
    }

    if (field.type === "multiselect") {
      return [];
    }

    if (field.type === "select" && field.options) {
      return field.options[0]?.value || "";
    }

    if (field.type === "richtext") {
      return "";
    }

    if (field.type === "fileupload") {
      return null;
    }

    return "";
  }

  /**
   * Check if a field should be excluded from form submission
   * @param {Object} field - Field configuration
   * @returns {boolean} - Whether to exclude the field
   */
  static shouldExcludeFromSubmission(field) {
    // File upload fields are handled separately and shouldn't be included in form data
    return field.type === "fileupload";
  }

  static getAllFieldTypes() {
    return {
      ...BASIC_FIELD_TYPES,
      ...ENTITY_FIELD_TYPES,
    };
  }

  static getModelSpecificFields(modelName) {
    return MODEL_SPECIFIC_FIELDS[modelName] || { fieldNames: {}, fieldTypes: {} };
  }
}
