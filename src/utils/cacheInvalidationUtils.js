/**
 * Utility functions for intelligent cache invalidation in table components
 * Note: EntityWorkspace has its own cache management - this is only for table components
 */

/**
 * Common Norwegian plural patterns for entity names
 */
const getPluralForm = (entityName) => {
  const name = entityName.toLowerCase();

  // Special cases for Norwegian plurals
  const specialPlurals = {
    emne: "emner",
    krav: "krav", // same in plural
    tiltak: "tiltak", // same in plural
    status: "status", // same in plural
    vurdering: "vurderinger",
    enhet: "enheter",
    prosjekt: "prosjekter",
    lov: "lover",
    kravpakke: "kravpakker",
    kravreferansetype: "kravreferansetyper",
    user: "users", // English fallback
  };

  if (specialPlurals[name]) {
    return specialPlurals[name];
  }

  // Default pattern: add 'er' for most Norwegian nouns
  if (name.endsWith("e")) {
    return `${name}r`;
  }

  return `${name}er`;
};

/**
 * Get table component specific cache key variations for an entity type
 * This focuses on individual entity queries and basic list queries used by table components
 */
const getTableComponentCacheKeys = (entityName) => {
  const name = entityName.toLowerCase();
  const plural = getPluralForm(name);

  return [
    // Individual entity queries (e.g., getEmneById used by edit forms)
    [name],
    [plural],

    // Basic paginated queries used by table components
    [name, "paginated"],
    [plural, "paginated"],

    // Simple list queries
    [name, "simple"],
    [plural, "simple"],
  ];
};

/**
 * Invalidate caches for table component entity operations
 * This is focused on table components only - EntityWorkspace manages its own cache
 * @param {Object} queryClient - React Query client
 * @param {string} entityName - Name of the entity (e.g., "emne", "krav", "tiltak")
 * @param {Object} options - Additional options
 */
export const invalidateTableComponentCaches = (queryClient, entityName, options = {}) => {
  if (!entityName || entityName === "unknown") {
    console.warn("Cannot invalidate caches: entityName is unknown");
    return;
  }

  const cacheKeys = getTableComponentCacheKeys(entityName);

  // Invalidate all relevant cache keys for table components
  cacheKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
      exact: false,
    });
  });
};

/**
 * Invalidate caches after an entity creation in table components
 */
export const invalidateEntityCachesAfterCreate = (queryClient, entityName, options = {}) => {
  invalidateTableComponentCaches(queryClient, entityName, { ...options, action: "create" });
};

/**
 * Invalidate caches after an entity update in table components
 */
export const invalidateEntityCachesAfterUpdate = (queryClient, entityName, options = {}) => {
  invalidateTableComponentCaches(queryClient, entityName, { ...options, action: "update" });
};

/**
 * Invalidate caches after an entity deletion in table components
 */
export const invalidateEntityCachesAfterDelete = (queryClient, entityName, options = {}) => {
  invalidateTableComponentCaches(queryClient, entityName, { ...options, action: "delete" });
};
