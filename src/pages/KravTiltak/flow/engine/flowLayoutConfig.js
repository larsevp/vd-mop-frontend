/**
 * Flow Layout Configuration Defaults
 * KISS: single place to tune spacing without touching algorithm code.
 *
 * Terminology mapping:
 *  - vertical_distance_within_emne: distance between sibling entity centers inside same emne cluster
 *  - vertical_distance_between_emne: gap between consecutive emne clusters (their top bounding boxes)
 *  - horizontal_distance_between_columns: Dagre rank separation (left→right columns)
 */
export const flowLayoutConfig = {
  LAYOUT: {
    vertical_distance_within_emne: 140, // ENTITY_SPACING (approx node height + margin)
    vertical_distance_between_emne: 240, // Cluster gap after post-spacing
    horizontal_distance_between_columns: 120, // Dagre ranksep (LR mode => horizontal)
    min_cluster_height: 220, // Ensures tiny clusters still reserve visual space
    enable_cluster_spread: true, // Apply deterministic post-layout vertical spreading
    enable_multi_parent_adjust: false, // Optional second pass for multi-parent averaging
  },
};

/** Convenience helper to merge user overrides */
export function buildFlowLayoutConfig(overrides = {}) {
  const base = JSON.parse(JSON.stringify(flowLayoutConfig));
  return {
    ...base,
    LAYOUT: {
      ...base.LAYOUT,
      ...(overrides.LAYOUT || {}),
    },
  };
}
