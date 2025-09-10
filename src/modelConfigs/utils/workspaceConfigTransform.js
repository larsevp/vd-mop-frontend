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
export function transformWorkspaceConfig(newConfig) {
  if (!newConfig || !newConfig.sections) {
    // If it's already in legacy format or empty, return as-is
    return newConfig;
  }

  const transformed = {
    workspace: {
      ...newConfig.workspace,
      detailForm: {
        // Preserve existing arrays
        workspaceHiddenIndex: newConfig.workspaceHiddenIndex || [],
        workspaceHiddenEdit: newConfig.workspaceHiddenEdit || [],
        workspaceHiddenCreate: newConfig.workspaceHiddenCreate || [],

        // Transform sections
        sections: {},

        // Transform field overrides
        fieldOverrides: {},

        // Transform rows
        rows: {},
      },
    },
  };

  // Transform sections structure
  Object.entries(newConfig.sections).forEach(([sectionName, sectionConfig]) => {
    // Handle both object and array formats
    if (Array.isArray(newConfig.sections)) {
      // Array format - find section by name
      const section = newConfig.sections.find((s) => s.name === sectionName);
      if (section) {
        sectionConfig = section;
      }
    }

    transformed.workspace.detailForm.sections[sectionName] = {
      title: sectionConfig.title,
      defaultExpanded: sectionConfig.defaultExpanded,
      ...(sectionConfig.noTitle && { noTitle: sectionConfig.noTitle }),
    };

    // Transform field overrides within sections
    if (sectionConfig.fieldOverrides) {
      Object.entries(sectionConfig.fieldOverrides).forEach(([fieldName, fieldConfig]) => {
        transformed.workspace.detailForm.fieldOverrides[fieldName] = {
          section: sectionName,
          ...fieldConfig,
        };
      });
    }

    // Transform rows within sections
    if (sectionConfig.rows) {
      // Handle both object and array formats for rows
      if (Array.isArray(sectionConfig.rows)) {
        sectionConfig.rows.forEach((row) => {
          if (row.name) {
            // Remove unsupported properties like className
            const { className, fields, ...supportedRowConfig } = row;
            transformed.workspace.detailForm.rows[row.name] = supportedRowConfig;
          }
        });
      } else {
        Object.entries(sectionConfig.rows).forEach(([rowName, rowConfig]) => {
          // Extract field configurations from rows and add them to fieldOverrides
          const { className, ...fieldConfigs } = rowConfig;
          Object.entries(fieldConfigs).forEach(([fieldName, fieldConfig]) => {
            if (!transformed.workspace.detailForm.fieldOverrides[fieldName]) {
              transformed.workspace.detailForm.fieldOverrides[fieldName] = {
                section: sectionName,
              };
            }
            // Merge row-based field config with existing fieldOverrides
            transformed.workspace.detailForm.fieldOverrides[fieldName] = {
              ...transformed.workspace.detailForm.fieldOverrides[fieldName],
              ...fieldConfig,
              row: rowName, // Preserve the row assignment
            };
          });
          // Keep only supported properties in rows
          transformed.workspace.detailForm.rows[rowName] = {};
        });
      }
    }
  });

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
