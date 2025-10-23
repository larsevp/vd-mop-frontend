/**
 * Entity Type Badge Utilities
 *
 * Provides consistent styling and configuration for entity type badges
 * across Krav/Tiltak and ProsjektKrav/ProsjektTiltak entities
 */

/**
 * Entity type configurations with colors and labels
 * Scandinavian design: muted, sophisticated colors
 */
export const ENTITY_TYPE_CONFIGS = {
  krav: {
    badgeColor: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    label: "krav",
    shortLabel: "Krav",
  },
  tiltak: {
    badgeColor: "bg-sky-100 text-sky-800 border border-sky-200",
    label: "tiltak",
    shortLabel: "Tiltak",
  },
  prosjektkrav: {
    badgeColor: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    label: "p-krav",
    shortLabel: "Krav",
  },
  prosjekttiltak: {
    badgeColor: "bg-sky-100 text-sky-800 border border-sky-200",
    label: "p-tiltak",
    shortLabel: "Tiltak",
  },
};

/**
 * Get entity type configuration
 * @param {string} entityType - The entity type
 * @returns {Object} Configuration object with badgeColor, label, shortLabel
 */
export const getEntityTypeConfig = (entityType) => {
  return (
    ENTITY_TYPE_CONFIGS[entityType?.toLowerCase()] || {
      badgeColor: "bg-gray-100 text-gray-700",
      label: entityType || "unknown",
      shortLabel: entityType || "UNKNOWN",
    }
  );
};

/**
 * Create badge classes for entity type
 * @param {string} entityType - The entity type
 * @returns {string} CSS classes for the badge
 */
export const getEntityTypeBadgeClasses = (entityType) => {
  const config = getEntityTypeConfig(entityType);
  return `inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${config.badgeColor}`;
};

/**
 * Get entity type label
 * @param {string} entityType - The entity type
 * @param {boolean} short - Whether to use short label (default: false)
 * @returns {string} Label for the entity type
 */
export const getEntityTypeLabel = (entityType, short = false) => {
  const config = getEntityTypeConfig(entityType);
  return short ? config.shortLabel : config.label;
};

/**
 * Generate type count badges for combined views
 * @param {Object} typeCounts - Object with counts for each entity type
 * @returns {Array} Array of badge objects with count, label, classes
 */
export const generateTypeCountBadges = (typeCounts) => {
  if (!typeCounts) return [];

  const badges = [];

  // Check for krav/prosjektkrav
  const kravCount = typeCounts.krav || typeCounts.prosjektkrav || 0;
  const kravType = typeCounts.krav ? "krav" : "prosjektkrav";

  if (kravCount > 0) {
    badges.push({
      count: kravCount,
      label: getEntityTypeLabel(kravType),
      classes: getEntityTypeBadgeClasses(kravType),
    });
  }

  // Check for tiltak/prosjekttiltak
  const tiltakCount = typeCounts.tiltak || typeCounts.prosjekttiltak || 0;
  const tiltakType = typeCounts.tiltak ? "tiltak" : "prosjekttiltak";

  if (tiltakCount > 0) {
    badges.push({
      count: tiltakCount,
      label: getEntityTypeLabel(tiltakType),
      classes: getEntityTypeBadgeClasses(tiltakType),
    });
  }

  return badges;
};
