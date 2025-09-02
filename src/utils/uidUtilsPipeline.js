/**
 * UID Resolution Pipeline - A robust system for extracting UIDs from various entity types
 */

/**
 * Pipeline-based UID resolver class
 */
class UIDResolver {
  constructor() {
    // Define the resolution pipeline - order matters!
    this.pipeline = [
      this.resolveFromUidField.bind(this),
      this.resolveFromEntityType.bind(this),
      this.resolveFromNestedRelations.bind(this),
      this.resolveFromParentRelations.bind(this),
      this.generateFallbackUID.bind(this),
    ];
  }

  /**
   * Main resolution method - runs through the pipeline
   * @param {Object} entity - The entity object
   * @param {Object} options - Resolution options
   * @param {string} [options.entityType] - Entity type hint
   * @param {string} [options.uidField] - Specific UID field from model config
   * @param {boolean} [options.allowFallback=true] - Whether to generate fallback UID
   * @returns {string|null} - Resolved UID or null
   */
  resolve(entity, options = {}) {
    if (!entity || typeof entity !== "object") {
      return null;
    }

    const context = {
      entity,
      entityType: options.entityType || entity.entityType,
      uidField: options.uidField,
      allowFallback: options.allowFallback !== false,
      result: null,
    };

    // Run through the pipeline until we get a result
    for (const resolver of this.pipeline) {
      const result = resolver(context);
      if (result) {
        context.result = result;
        return result;
      }
    }

    return null;
  }

  /**
   * Step 1: Try to resolve from explicitly specified UID field (from model config)
   */
  resolveFromUidField(context) {
    const { entity, uidField } = context;
    if (uidField && entity[uidField]) {
      return entity[uidField];
    }
    return null;
  }

  /**
   * Step 2: Resolve based on entity type with known UID field mappings
   */
  resolveFromEntityType(context) {
    const { entity, entityType } = context;

    // Map entity types to their primary UID fields
    const entityTypeUIDMap = {
      krav: "kravUID",
      prosjektkrav: "kravUID",
      tiltak: "tiltakUID",
      prosjekttiltak: "tiltakUID",
      enhet: "enhetUID",
      prosjekt: "prosjektUID",
    };

    const normalizedEntityType = entityType?.toLowerCase();
    const uidField = entityTypeUIDMap[normalizedEntityType];

    if (uidField && entity[uidField]) {
      return entity[uidField];
    }

    // Try generic UID fields as fallback
    const genericFields = ["kravUID", "tiltakUID", "prosjektKravUID", "prosjektTiltakUID", "uid", "UID"];
    for (const field of genericFields) {
      if (entity[field]) {
        return entity[field];
      }
    }

    return null;
  }

  /**
   * Step 3: Resolve from nested relations (e.g., ProsjektTiltak -> ProsjektKrav)
   */
  resolveFromNestedRelations(context) {
    const { entity, entityType } = context;

    // ProsjektTiltak might have UID in its associated ProsjektKrav
    if (entityType === "prosjekttiltak" || entityType === "prosjekt-tiltak") {
      if (entity.prosjektKrav?.kravUID) return entity.prosjektKrav.kravUID;
      if (entity.krav?.kravUID) return entity.krav.kravUID;

      // Check array of krav relations
      if (Array.isArray(entity.prosjektKrav) && entity.prosjektKrav.length > 0) {
        const firstKrav = entity.prosjektKrav[0];
        if (firstKrav.kravUID) return firstKrav.kravUID;
      }
      if (Array.isArray(entity.krav) && entity.krav.length > 0) {
        const firstKrav = entity.krav[0];
        if (firstKrav.kravUID) return firstKrav.kravUID;
      }
    }

    return null;
  }

  /**
   * Step 4: Resolve from parent relationships
   */
  resolveFromParentRelations(context) {
    const { entity } = context;

    // Check direct parent relationship
    if (entity.parent) {
      const parentUID = this.resolve(entity.parent, { allowFallback: false });
      if (parentUID) return parentUID;
    }

    // Check _parentKrav (used in combined views)
    if (entity._parentKrav) {
      const parentKravUID = this.resolve(entity._parentKrav, { allowFallback: false });
      if (parentKravUID) return parentKravUID;
    }

    return null;
  }

  /**
   * Step 5: Generate fallback UID if allowed
   */
  generateFallbackUID(context) {
    const { entity, entityType, allowFallback } = context;

    if (!allowFallback) {
      return null;
    }

    if (entity.id && entityType) {
      return `${entityType.toUpperCase()}${entity.id}`;
    }

    if (entity.id) {
      return entity.id.toString();
    }

    return null;
  }
}

// Create singleton instance
const uidResolver = new UIDResolver();

// Export both the class and convenience functions
export { UIDResolver };

/**
 * Main UID resolution function - uses the pipeline resolver
 * @param {Object} entity - The entity object
 * @param {Object} options - Resolution options
 * @returns {string|null} - Resolved UID or null
 */
export function getEntityUID(entity, options = {}) {
  return uidResolver.resolve(entity, options);
}

/**
 * Gets the display UID for hierarchical references, prioritizing UID over ID
 * This is specifically for parent/child relationship display
 * @param {Object} entity - The entity object
 * @returns {string|null} - The UID for display, or null if not found
 */
export function getHierarchicalUID(entity) {
  if (!entity || typeof entity !== "object") {
    return null;
  }

  // For parent krav references in hierarchical display
  if (entity._parentKrav) {
    return getEntityUID(entity._parentKrav) || entity._parentKrav.id?.toString();
  }

  // For direct parent references
  if (entity.parent) {
    return getEntityUID(entity.parent) || entity.parent.id?.toString();
  }

  // For the entity itself
  return getEntityUID(entity);
}

/**
 * Gets the appropriate name/title for an entity
 * @param {Object} entity - The entity object
 * @returns {string} - The display name
 */
export function getEntityDisplayName(entity) {
  if (!entity || typeof entity !== "object") {
    return "";
  }

  return entity.navn || entity.tittel || entity.name || entity.title || `ID: ${entity.id || "Unknown"}`;
}

/**
 * Formats a hierarchical reference for display
 * Combines UID and name in a readable format
 * @param {Object} entity - The entity with parent/hierarchical reference
 * @returns {string|null} - Formatted reference or null if no parent
 */
export function formatHierarchicalReference(entity) {
  const parentEntity = entity._parentKrav || entity.parent;

  if (!parentEntity) {
    return null;
  }

  const uid = getEntityUID(parentEntity);
  const name = getEntityDisplayName(parentEntity);

  if (uid && name) {
    return `${uid} - ${name}`;
  } else if (uid) {
    return uid;
  } else if (name) {
    return name;
  }

  return null;
}
