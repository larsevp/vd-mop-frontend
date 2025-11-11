/**
 * Vertical Columnar Layout Configuration
 * Defines spacing, sizing, and positioning parameters for the vertical "spreadsheet" layout
 */

export const VERTICAL_LAYOUT_CONFIG = {
  // Column dimensions
  columnWidth: 350, // Width of each emne column
  columnSpacing: 100, // Horizontal spacing between columns (reduced)

  // Vertical spacing
  headerHeight: 100, // Height reserved for emne header at top
  entitySpacing: 20, // Vertical spacing between stacked entities (reduced significantly)

  // Starting positions
  startX: 100, // Left margin for first column
  startY: 50, // Top margin for emne headers

  // Node dimensions (should match node components)
  emneNodeWidth: 320,
  emneNodeHeight: 65,
  entityNodeWidth: 320,
  entityNodeBaseHeight: 120,

  // Visual spacing adjustments
  emneToEntityGap: 30, // Extra gap between emne header and first entity (reduced)
};

/**
 * Get default config merged with custom overrides
 */
export function getVerticalLayoutConfig(customConfig = {}) {
  return {
    ...VERTICAL_LAYOUT_CONFIG,
    ...customConfig,
  };
}
