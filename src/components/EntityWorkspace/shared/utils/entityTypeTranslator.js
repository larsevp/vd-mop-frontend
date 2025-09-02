/**
 * EntityTypeTranslator - Centralized entity type naming utility
 * Single source of truth for entity type name conversions across the EntityWorkspace
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
        return this._toKebabCase(baseCamelCase);
      default:
        return baseCamelCase;
    }
  }

  /**
   * Check if entity type is a project-specific entity
   * @param {string} entityType - Entity type to check
   * @returns {boolean} True if it's a project entity
   */
  static isProjectEntity(entityType) {
    const normalized = this.translate(entityType, "camelCase");
    return normalized.startsWith("prosjekt");
  }

  /**
   * Get all valid entity types in specified format
   * @param {string} format - Target format
   * @returns {string[]} Array of entity types
   */
  static getAllTypes(format = "camelCase") {
    return Object.values(this.CORE_TYPES).map((type) => this.translate(type, format));
  }

  /**
   * Convert string to camelCase
   * @private
   */
  static _toCamelCase(str) {
    return str
      .toLowerCase()
      .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
      .replace(/^([a-z])/, (match, letter) => letter.toLowerCase());
  }

  /**
   * Convert camelCase to kebab-case
   * @private
   */
  static _toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  /**
   * Validate entity type
   * @param {string} entityType - Entity type to validate
   * @returns {boolean} True if valid
   */
  static isValidType(entityType) {
    const normalized = entityType.toLowerCase().replace(/-/g, "");
    return Object.keys(this.CORE_TYPES).includes(normalized);
  }

  /**
   * Get display name for entity type
   * @param {string} entityType - Entity type
   * @param {boolean} plural - Whether to return plural form
   * @returns {string} Display name
   */
  static getDisplayName(entityType, plural = false) {
    const camelCase = this.translate(entityType, "camelCase");

    const displayNames = {
      krav: plural ? "Krav" : "Krav",
      tiltak: plural ? "Tiltak" : "Tiltak",
      prosjektKrav: plural ? "Prosjekt Krav" : "Prosjekt Krav",
      prosjektTiltak: plural ? "Prosjekt Tiltak" : "Prosjekt Tiltak",
      combinedEntities: plural ? "Krav og Tiltak" : "Krav og Tiltak",
      prosjektCombined: plural ? "Prosjekt Krav og Tiltak" : "Prosjekt Krav og Tiltak",
    };

    return displayNames[camelCase] || camelCase;
  }

  /**
   * Get API endpoint format for entity type
   * @param {string} entityType - Entity type
   * @returns {string} API endpoint format
   */
  static getApiEndpoint(entityType) {
    return this.translate(entityType, "api");
  }
}

export default EntityTypeTranslator;
