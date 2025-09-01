/**
 * ConfigProcessor - Processes modelConfig for the four supported entity types
 * Supports: krav, tiltak, prosjektKrav, prosjektTiltak
 */

import { modelConfigs } from "@/modelConfigs";

export class ConfigProcessor {
  // Supported entity types for EntityWorkspace
  static SUPPORTED_TYPES = ['krav', 'tiltak', 'prosjektKrav', 'prosjektTiltak'];

  /**
   * Process and validate modelConfig for EntityWorkspace
   */
  static processConfig(entityType) {
    if (!this.SUPPORTED_TYPES.includes(entityType)) {
      throw new Error(`EntityWorkspace only supports: ${this.SUPPORTED_TYPES.join(', ')}`);
    }

    const baseConfig = modelConfigs[entityType];
    if (!baseConfig) {
      throw new Error(`No modelConfig found for ${entityType}`);
    }

    return {
      ...baseConfig,
      entityType,
      // Ensure workspace config exists
      workspace: {
        enabled: true,
        layout: 'split',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
        ...baseConfig.workspace
      },
      // Process display configuration
      display: this.processDisplayConfig(baseConfig, entityType),
      // Process form configuration  
      form: this.processFormConfig(baseConfig, entityType),
      // Process list configuration
      list: this.processListConfig(baseConfig, entityType)
    };
  }

  /**
   * Process display configuration for detail view
   */
  static processDisplayConfig(config, entityType) {
    return {
      title: config.title || entityType,
      icon: config.icon,
      fields: config.detailFields || config.fields || [],
      sections: config.detailSections || [],
      ...config.display
    };
  }

  /**
   * Process form configuration
   */
  static processFormConfig(config, entityType) {
    return {
      fields: config.formFields || config.fields || [],
      validation: config.validation || {},
      layout: config.formLayout || 'vertical',
      ...config.form
    };
  }

  /**
   * Process list configuration  
   */
  static processListConfig(config, entityType) {
    return {
      columns: config.listColumns || config.columns || [],
      sorting: config.sorting || { field: 'id', direction: 'desc' },
      filtering: config.filtering || {},
      pagination: config.pagination || { pageSize: 20 },
      ...config.list
    };
  }

  /**
   * Get API functions for entity type
   */
  static getAPIFunctions(config) {
    return {
      queryFn: config.queryFn,
      queryFnAll: config.queryFnAll,
      queryFnGrouped: config.queryFnGroupedByEmne,
      getByIdFn: config.getByIdFn,
      createFn: config.createFn,
      updateFn: config.updateFn,
      deleteFn: config.deleteFn
    };
  }
}