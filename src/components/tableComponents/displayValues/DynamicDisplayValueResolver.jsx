// Dynamic wrapper for DisplayValueResolver that handles mixed entity types
import { DisplayValueResolver } from "./DisplayValueResolver.jsx";

/**
 * Wrapper for DisplayValueResolver that automatically detects entity type
 * and applies the appropriate model configuration for mixed entity displays.
 * 
 * This enables showing Krav and Tiltak together in the same component
 * while maintaining their individual display logic and formatting.
 */
export class DynamicDisplayValueResolver {
  /**
   * Resolve display value with automatic entity type detection
   * @param {Object} row - Data row object (may contain entityType field)
   * @param {Object} field - Field configuration object
   * @param {Object} context - Display context with source, format, and modelName
   * @returns {string|React.Element} - Display value (string for LIST, React element for REACT format)
   */
  static resolveDisplayValue(row, field, context = {}) {
    // If row has entityType, dynamically determine the modelName
    if (row.entityType) {
      const dynamicModelName = this.getModelNameFromEntityType(row.entityType);
      const enhancedContext = {
        ...context,
        modelName: dynamicModelName || context.modelName
      };
      return DisplayValueResolver.resolveDisplayValue(row, field, enhancedContext);
    }
    
    // Fallback to original behavior for single-entity views
    return DisplayValueResolver.resolveDisplayValue(row, field, context);
  }

  /**
   * Map combined entity types to their corresponding model names
   * Only handles general entities - project-specific entities should use separate components
   * @param {string} entityType - The entityType from CombinedEntityItem
   * @returns {string|null} - Corresponding model name for display configuration
   */
  static getModelNameFromEntityType(entityType) {
    switch (entityType) {
      case 'krav':
        return 'krav';
      case 'tiltak': 
        return 'tiltak';
      default:
        console.warn(`Unsupported entityType for general combined view: ${entityType}. Use separate components for project-specific entities.`);
        return null;
    }
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