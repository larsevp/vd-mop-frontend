/**
 * Workspace Config Transform Utilities
 *
 * Provides backward compatibility for the new workspace config structure
 * while allowing cleaner, more intuitive configuration.
 */

/**
 * Transform new workspace config structure to legacy format
 * @param {Object} newConfig - New simplified config structure
 * @returns {Object} Legacy config structure
 */
/**
 * Helper function to transform sections structure
 */
function transformSections(sections, baseHiddenIndex = [], baseHiddenEdit = [], baseHiddenCreate = []) {
  const result = {
    workspaceHiddenIndex: baseHiddenIndex,
    workspaceHiddenEdit: baseHiddenEdit,
    workspaceHiddenCreate: baseHiddenCreate,
    sections: {},
    fieldOverrides: {},
    rows: {},
  };

  // Transform sections structure
  Object.entries(sections).forEach(([sectionName, sectionConfig]) => {
    result.sections[sectionName] = {
      title: sectionConfig.title,
      defaultExpanded: sectionConfig.defaultExpanded,
      ...(sectionConfig.noTitle && { noTitle: sectionConfig.noTitle }),
    };

    // NEW: Transform layout array format (simpler, sequential approach)
    if (sectionConfig.layout && Array.isArray(sectionConfig.layout)) {
      let orderCounter = 1;
      let rowCounter = 1;

      sectionConfig.layout.forEach((item) => {
        if (item.field) {
          // Single field - full width
          // Support both string and object format: "fieldName" or { name: "fieldName", default: "value" }
          const fieldName = typeof item.field === 'string' ? item.field : item.field.name;
          const fieldConfig = {
            section: sectionName,
            order: orderCounter++,
          };

          // Add default value if specified
          if (typeof item.field === 'object' && item.field.default !== undefined) {
            fieldConfig.default = item.field.default;
          }

          result.fieldOverrides[fieldName] = fieldConfig;
        } else if (item.row && Array.isArray(item.row)) {
          // Row with multiple fields - side by side
          const rowName = `row-${rowCounter++}`;
          item.row.forEach((fieldConfig) => {
            // Support both string and object format
            const fieldName = typeof fieldConfig === 'string' ? fieldConfig : fieldConfig.name;
            const config = {
              section: sectionName,
              order: orderCounter,
              row: rowName,
            };

            // Add default value if specified
            if (typeof fieldConfig === 'object' && fieldConfig.default !== undefined) {
              config.default = fieldConfig.default;
            }

            result.fieldOverrides[fieldName] = config;
          });
          result.rows[rowName] = {};
          orderCounter++;
        }
      });
    }

    // LEGACY: Transform field overrides within sections (for backward compatibility)
    if (sectionConfig.fieldOverrides) {
      Object.entries(sectionConfig.fieldOverrides).forEach(([fieldName, fieldConfig]) => {
        result.fieldOverrides[fieldName] = {
          section: sectionName,
          ...fieldConfig,
        };
      });
    }

    // LEGACY: Transform rows within sections (for backward compatibility)
    if (sectionConfig.rows) {
      // Handle both object and array formats for rows
      if (Array.isArray(sectionConfig.rows)) {
        sectionConfig.rows.forEach((row) => {
          if (row.name) {
            // Remove unsupported properties like className
            const { className, fields, ...supportedRowConfig } = row;
            result.rows[row.name] = supportedRowConfig;
          }
        });
      } else {
        Object.entries(sectionConfig.rows).forEach(([rowName, rowConfig]) => {
          // Extract field configurations from rows and add them to fieldOverrides
          const { className, ...fieldConfigs } = rowConfig;
          Object.entries(fieldConfigs).forEach(([fieldName, fieldConfig]) => {
            if (!result.fieldOverrides[fieldName]) {
              result.fieldOverrides[fieldName] = {
                section: sectionName,
              };
            }
            // Merge row-based field config with existing fieldOverrides
            result.fieldOverrides[fieldName] = {
              ...result.fieldOverrides[fieldName],
              ...fieldConfig,
              row: rowName // Preserve row information for EntityDetailPane
            };
          });
          // Keep only supported properties in rows
          result.rows[rowName] = {};
        });
      }
    }
  });

  return result;
}

export function transformWorkspaceConfig(newConfig) {
  if (!newConfig || !newConfig.sections) {
    // If it's already in legacy format or empty, return as-is
    return newConfig;
  }

  const transformed = {
    workspace: {
      ...newConfig.workspace,
      detailForm: {
        // Preserve view options
        hideEmptyFieldsInView: newConfig.hideEmptyFieldsInView || false,
        collapseEmptySectionsInView: newConfig.collapseEmptySectionsInView || false,

        // Transform main sections
        ...transformSections(
          newConfig.sections,
          newConfig.workspaceHiddenIndex || [],
          newConfig.workspaceHiddenEdit || [],
          newConfig.workspaceHiddenCreate || []
        ),
      },
    },
  };

  // Transform detailFormLinked if it exists (for linked entity creation)
  if (newConfig.workspace?.detailFormLinked) {
    const linkedConfig = newConfig.workspace.detailFormLinked;
    transformed.workspace.detailFormLinked = {
      // Preserve view options
      hideEmptyFieldsInView: linkedConfig.hideEmptyFieldsInView || false,
      collapseEmptySectionsInView: linkedConfig.collapseEmptySectionsInView || false,

      // Transform linked sections
      ...transformSections(
        linkedConfig.sections,
        linkedConfig.workspaceHiddenIndex || [],
        linkedConfig.workspaceHiddenEdit || [],
        linkedConfig.workspaceHiddenCreate || []
      ),
    };

    // Handle global field overrides for linked form
    if (linkedConfig.fieldOverrides) {
      Object.entries(linkedConfig.fieldOverrides).forEach(([fieldName, fieldConfig]) => {
        transformed.workspace.detailFormLinked.fieldOverrides[fieldName] = {
          ...transformed.workspace.detailFormLinked.fieldOverrides[fieldName],
          ...fieldConfig,
        };
      });
    }
  }

  // Handle global field overrides (outside of sections)
  if (newConfig.fieldOverrides) {
    Object.entries(newConfig.fieldOverrides).forEach(([fieldName, fieldConfig]) => {
      transformed.workspace.detailForm.fieldOverrides[fieldName] = {
        ...transformed.workspace.detailForm.fieldOverrides[fieldName],
        ...fieldConfig,
      };
    });
  }

  return transformed;
}

/**
 * Validate new workspace config structure
 * @param {Object} config - Config to validate
 * @returns {Array} Array of validation errors (empty if valid)
 */
export function validateWorkspaceConfig(config) {
  const errors = [];

  if (!config) {
    errors.push("Config is required");
    return errors;
  }

  if (config.sections) {
    // Handle both array and object formats
    const sections = Array.isArray(config.sections) ? config.sections : Object.values(config.sections);

    sections.forEach((sectionConfig) => {
      const sectionName = sectionConfig.name || "unnamed";
      if (!sectionConfig.title && !sectionConfig.noTitle) {
        errors.push(`Section '${sectionName}' must have a title or noTitle: true`);
      }

      if (typeof sectionConfig.defaultExpanded !== "boolean") {
        errors.push(`Section '${sectionName}' must have defaultExpanded as boolean`);
      }

      if (sectionConfig.rows) {
        // Handle both array and object formats for rows
        const rows = Array.isArray(sectionConfig.rows) ? sectionConfig.rows : Object.values(sectionConfig.rows);
        rows.forEach((rowConfig) => {
          if (typeof rowConfig !== "object") {
            errors.push(`Row in section '${sectionName}' must be an object`);
          }
        });
      }
    });
  }

  return errors;
}

/**
 * Create a workspace config builder for easier configuration
 * @param {string} entityType - The entity type (for better error messages)
 * @returns {Object} Builder object with fluent API
 */
export function createWorkspaceConfigBuilder(entityType = "entity") {
  const config = {
    sections: {},
    fieldOverrides: {},
    workspace: {},
    workspaceHiddenIndex: [],
    workspaceHiddenEdit: [],
    workspaceHiddenCreate: [],
  };

  return {
    // Add workspace-level settings
    setWorkspace(workspaceConfig) {
      Object.assign(config.workspace, workspaceConfig);
      return this;
    },

    // Add hidden fields
    hideInIndex(fields) {
      config.workspaceHiddenIndex.push(...fields);
      return this;
    },

    hideInEdit(fields) {
      config.workspaceHiddenEdit.push(...fields);
      return this;
    },

    hideInCreate(fields) {
      config.workspaceHiddenCreate.push(...fields);
      return this;
    },

    // Add a section
    addSection(name, { title, defaultExpanded = false, noTitle = false, fieldOverrides = {}, rows = {} }) {
      config.sections[name] = {
        title,
        defaultExpanded,
        ...(noTitle && { noTitle }),
        fieldOverrides,
        rows,
      };
      return this;
    },

    // Add global field override
    addFieldOverride(fieldName, overrides) {
      config.fieldOverrides[fieldName] = overrides;
      return this;
    },

    // Build the final config
    build() {
      const errors = validateWorkspaceConfig(config);
      if (errors.length > 0) {
        throw new Error(`Workspace config validation failed for ${entityType}: ${errors.join(", ")}`);
      }
      return transformWorkspaceConfig(config);
    },

    // Get raw config (for inspection)
    getRaw() {
      return config;
    },
  };
}
