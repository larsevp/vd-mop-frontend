/**
 * EntityTypeTranslator - Centralized entity type naming utility
 * Single source of truth for entity type name conversions across the application
 */

/**
 * Centralized entity type naming translator
 * Handles conversion between different naming conventions:
 * - camelCase: prosjektKrav, combinedEntities
 * - kebab-case: prosjekt-krav, combined-entities
 * - lowercase: prosjektkrav, combinedentities
 * - api: prosjekt-krav (for API endpoints)
 */
export class EntityTypeTranslator {
  /**
   * Core entity type mappings - canonical camelCase versions
   */
  static CORE_TYPES = {
    krav: "krav",
    tiltak: "tiltak",
    prosjektkrav: "prosjektKrav",
    prosjekttiltak: "prosjektTiltak",
    combined: "combinedEntities",
    combinedentities: "combinedEntities",
    prosjektcombined: "prosjektCombined",
  };

  /**
   * Translate entity type to target format
   * @param {string} entityType - Input entity type in any format
   * @param {string} targetFormat - Target format: 'camelCase', 'kebab-case', 'lowercase', 'api'
   * @returns {string} Translated entity type
   */
  static translate(entityType, targetFormat = "camelCase") {
    if (!entityType || typeof entityType !== "string") return entityType;

    // Normalize input by removing hyphens and converting to lowercase
    const normalizedType = entityType.toLowerCase().replace(/-/g, "");

    // Get canonical camelCase version
    const baseCamelCase = this.CORE_TYPES[normalizedType] || this._toCamelCase(entityType);

    // Convert to target format
    switch (targetFormat) {
      case "camelCase":
        return baseCamelCase;
      case "kebab-case":
        return this._toKebabCase(baseCamelCase);
      case "lowercase":
        return baseCamelCase.toLowerCase();
      case "api":
        // For API endpoints - kebab case
        return this._toKebabCase(baseCamelCase);
      default:
        return baseCamelCase;
    }
  }

  /**
   * Convert kebab-case to camelCase
   * @param {string} str - kebab-case string
   * @returns {string} camelCase string
   */
  static _toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Convert camelCase to kebab-case
   * @param {string} str - camelCase string
   * @returns {string} kebab-case string
   */
  static _toKebabCase(str) {
    return str
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "");
  }

  /**
   * Detect if entity type is a project-specific entity
   * @param {string} entityType - Entity type in any format
   * @returns {boolean} True if project-specific
   */
  static isProjectEntity(entityType) {
    const normalized = this.translate(entityType, "lowercase");
    return normalized.includes("prosjekt");
  }

  /**
   * Detect if entity type is a combined entity type
   * @param {string} entityType - Entity type in any format
   * @returns {boolean} True if combined entity type
   */
  static isCombinedEntity(entityType) {
    const normalized = this.translate(entityType, "lowercase");
    return normalized.includes("combined");
  }

  /**
   * Get all supported entity types in target format
   * @param {string} targetFormat - Target format
   * @returns {string[]} Array of entity types
   */
  static getAllTypes(targetFormat = "camelCase") {
    return Object.values(this.CORE_TYPES).map((type) => this.translate(type, targetFormat));
  }

  /**
   * Validate if entity type is supported
   * @param {string} entityType - Entity type to validate
   * @returns {boolean} True if supported
   */
  static isSupported(entityType) {
    const normalized = entityType.toLowerCase().replace(/-/g, "");
    return normalized in this.CORE_TYPES;
  }
}

export default EntityTypeTranslator;
