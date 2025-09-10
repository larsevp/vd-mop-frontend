/**
 * Shared filtering utilities for KravTiltak domain
 * 
 * This contains domain-specific logic for extracting and processing
 * filter data from Krav, Tiltak, ProsjektKrav, and ProsjektTiltak entities.
 */

/**
 * Extract available filters for Select components (ID-based) and backwards compatibility (name-based)
 * This is the shared logic that all KravTiltak adapters should use
 * 
 * @param {Array} entities - Array of entity objects
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeEntityTypes - Whether to include entityTypes (for combined views)
 * @returns {Object} Available filter IDs and names for UI components
 */
export const extractAvailableFilters = (entities = [], options = {}) => {
  const { includeEntityTypes = false } = options;
  
  const filters = {
    statusIds: new Set(),
    vurderingIds: new Set(),
    emneIds: new Set(),
    // Keep names for backwards compatibility and display
    statuses: new Set(),
    vurderinger: new Set(),
    emner: new Set(),
  };

  // Add entityTypes for combined views
  if (includeEntityTypes) {
    filters.entityTypes = new Set();
  }

  entities.forEach((entity) => {
    // Extract status ID and name
    if (entity.status?.id) filters.statusIds.add(entity.status.id);
    const status = entity.status?.name || entity.status?.navn;
    if (status) filters.statuses.add(status);

    // Extract vurdering ID and name
    if (entity.vurdering?.id) filters.vurderingIds.add(entity.vurdering.id);
    const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
    if (vurdering) filters.vurderinger.add(vurdering);

    // Extract emne ID and name
    if (entity.emne?.id) filters.emneIds.add(entity.emne.id);
    const emne = entity.emne?.navn || entity.emne?.name;
    if (emne) filters.emner.add(emne);

    // Entity type values (for combined views)
    if (includeEntityTypes && entity.entityType) {
      filters.entityTypes.add(entity.entityType);
    }
  });

  const result = {
    // ID-based filters for Select components
    statusIds: Array.from(filters.statusIds).sort((a, b) => a - b),
    vurderingIds: Array.from(filters.vurderingIds).sort((a, b) => a - b),
    emneIds: Array.from(filters.emneIds).sort((a, b) => a - b),
    // Name-based filters for backwards compatibility
    statuses: Array.from(filters.statuses).sort(),
    vurderinger: Array.from(filters.vurderinger).sort(),
    emner: Array.from(filters.emner).sort(),
  };

  // Add entityTypes for combined views
  if (includeEntityTypes) {
    result.entityTypes = Array.from(filters.entityTypes).sort();
  }

  return result;
};