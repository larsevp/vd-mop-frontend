/**
 * UID Resolution Utils - Simple configuration-based approach
 *
 * Usage Examples:
 *
 * // Simple direct calls
 * const uid = getEntityUID(entity, entityType);
 * const parentUID = getParentUID(entity);
 * const displayName = getEntityDisplayName(entity);
 *
 * // Config-based batch resolution
 * const config = {
 *   uid: 'tiltakUID',
 *   parentUID: 'parent.kravUID',
 *   displayName: 'navn'
 * };
 * const resolved = resolveFromConfig(entity, config);
 */

import { EntityTypeTranslator } from "./entityTypeTranslator.js";

// Configuration maps for different entity types
const ENTITY_UID_CONFIG = {
  krav: {
    uid: "kravUID",
    parentUID: "parent.kravUID",
    // connectedEntityUID: The UID of the most relevant related entity for hierarchical display
    // For krav: shows parent krav UID, or self if no parent
    connectedEntityUID: "parent.kravUID || kravUID",
  },
  prosjektKrav: {
    uid: "kravUID",
    parentUID: "parent.kravUID",
    // connectedEntityUID: The UID of the most relevant related entity for hierarchical display
    // For prosjektKrav: shows parent krav UID, or self if no parent
    connectedEntityUID: "parent.kravUID || kravUID",
  },
  tiltak: {
    uid: "tiltakUID",
    parentUID: "parent.tiltakUID",
    // connectedEntityUID: The UID of the most relevant related entity for hierarchical display
    // For tiltak: shows parent tiltak UID, or self if no parent
    connectedEntityUID: "parent.tiltakUID || tiltakUID",
  },
  prosjektTiltak: {
    uid: "tiltakUID",
    parentUID: "parent.tiltakUID",
    kravUID: "prosjektKrav[0].kravUID || krav[0].kravUID",
    // connectedEntityUID: The UID of the most relevant related entity for hierarchical display
    // For prosjektTiltak: prefers related krav UID, then parent tiltak UID, then self
    connectedEntityUID: "prosjektKrav[0].kravUID || krav[0].kravUID || parent.tiltakUID || tiltakUID",
  },
  enhet: {
    uid: "enhetUID",
    parentUID: "parent.enhetUID",
    // connectedEntityUID: The UID of the most relevant related entity for hierarchical display
    // For enhet: shows parent enhet UID, or self if no parent
    connectedEntityUID: "parent.enhetUID || enhetUID",
  },
  prosjekt: {
    uid: "prosjektUID",
    parentUID: "parent.prosjektUID",
    // connectedEntityUID: The UID of the most relevant related entity for hierarchical display
    // For prosjekt: shows parent prosjekt UID, or self if no parent
    connectedEntityUID: "parent.prosjektUID || prosjektUID",
  },
};

/**
 * Get value from object using dot notation path with fallback
 * Supports array indexing like 'prosjektKrav[0].kravUID'
 * Supports || fallback syntax like 'parent.kravUID || kravUID'
 */
function getValueFromPath(obj, path) {
  if (!obj || !path) return null;

  // Handle fallback syntax (||)
  if (path.includes("||")) {
    const paths = path.split("||").map((p) => p.trim());
    for (const p of paths) {
      const value = getValueFromPath(obj, p);
      if (value !== null && value !== undefined) return value;
    }
    return null;
  }

  // Handle array indexing
  const pathWithArrays = path.replace(/\[(\d+)\]/g, ".$1");
  const keys = pathWithArrays.split(".");

  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return null;
    current = current[key];
  }

  return current;
}

/**
 * Get UID for any entity type
 */
export function getEntityUID(entity, entityType) {
  if (!entity) return null;

  const normalizedType = EntityTypeTranslator.translate(entityType || entity.entityType, "camelCase");
  const config = ENTITY_UID_CONFIG[normalizedType];

  if (config?.uid) {
    const uid = getValueFromPath(entity, config.uid);

    if (uid) return uid;
  }

  // Generic fallback
  const genericFields = ["kravUID", "tiltakUID", "prosjektKravUID", "prosjektTiltakUID", "enhetUID", "prosjektUID", "uid", "UID"];
  for (const field of genericFields) {
    if (entity[field]) {
      //console.log("🔧 getEntityUID fallback result:", entity[field]);
      return entity[field];
    }
  }

  // Generate fallback UID if needed
  if (entity.id && normalizedType) {
    const displayName = EntityTypeTranslator.getDisplayName(normalizedType, false);
    const generatedUID = `${displayName.toUpperCase().replace(/\s/g, "")}${entity.id}`;
    //console.log("🔧 getEntityUID generated result:", generatedUID);
    return generatedUID;
  }

  //console.log("🔧 getEntityUID final fallback:", entity.id?.toString() || null);
  return entity.id?.toString() || null;
}

/**
 * Get parent UID
 */
export function getParentUID(entity, entityType) {
  if (!entity?.parent) return null;
  return getEntityUID(entity.parent, entity.parent.entityType);
}

/**
 * Get parent krav UID (for combined views)
 */
export function getParentKravUID(entity) {
  if (!entity?._parentKrav) return null;
  return getEntityUID(entity._parentKrav, "krav");
}

/**
 * Get krav UID for ProsjektTiltak
 */
export function getKravUID(entity, entityType) {
  const normalizedType = EntityTypeTranslator.translate(entityType || entity.entityType, "camelCase");

  if (normalizedType !== "prosjektTiltak") return null;

  const config = ENTITY_UID_CONFIG[normalizedType];
  if (config?.kravUID) {
    return getValueFromPath(entity, config.kravUID);
  }

  return null;
}

/**
 * Get connected entity UID (prefers related entities over self)
 */
export function getConnectedEntityUID(entity, entityType, isParentDisplay = false) {
  if (isParentDisplay) {
    /*
    console.log("🔍 Parent/Related Entity UID Resolution:", {
      entity: entity,
      entityType,
      entityEntityType: entity?.entityType,
      hasEntity: !!entity,
    }); */
  }

  const normalizedType = EntityTypeTranslator.translate(entityType || entity.entityType, "camelCase");
  const config = ENTITY_UID_CONFIG[normalizedType];

  if (config?.connectedEntityUID) {
    const result = getValueFromPath(entity, config.connectedEntityUID);
    if (isParentDisplay) {
    }
    return result;
  }

  // Fallback to regular UID
  const fallbackResult = getEntityUID(entity, entityType);
  if (isParentDisplay) {
    //console.log("🔍 Parent UID Fallback Result:", fallbackResult);
  }
  return fallbackResult;
}

/**
 * Get display name
 */
export function getEntityDisplayName(entity) {
  if (!entity) return "";
  return entity.navn || entity.tittel || entity.name || entity.title || "";
}

/**
 * Get entity ID
 */
export function getEntityID(entity) {
  return entity?.id?.toString() || null;
}

/**
 * Check if entity has parent
 */
export function hasParent(entity) {
  return !!(entity?.parent || entity?._parentKrav);
}

/**
 * Resolve multiple values from config
 *
 * @param {Object} entity - The entity to resolve from
 * @param {Object} config - Config object mapping keys to entity paths
 * @param {string} entityType - Optional entity type
 * @returns {Object} Resolved values
 *
 * Example:
 * const config = {
 *   uid: 'tiltakUID',
 *   parentUID: 'parent.kravUID',
 *   displayName: 'navn'
 * };
 * const resolved = resolveFromConfig(entity, config, 'prosjektTiltak');
 */
export function resolveFromConfig(entity, config, entityType) {
  if (!entity || !config) return {};

  const result = {};

  for (const [key, path] of Object.entries(config)) {
    result[key] = getValueFromPath(entity, path);
  }

  return result;
}

/**
 * Get all common information about an entity
 */
export function getAllEntityInfo(entity, entityType) {
  return {
    uid: getEntityUID(entity, entityType),
    parentUID: getParentUID(entity, entityType),
    parentKravUID: getParentKravUID(entity),
    kravUID: getKravUID(entity, entityType),
    connectedEntityUID: getConnectedEntityUID(entity, entityType),
    displayName: getEntityDisplayName(entity),
    id: getEntityID(entity),
    hasParent: hasParent(entity),
  };
}

// Backwards compatibility - simple functions that don't require class instantiation
export const uidUtils = {
  getEntityUID,
  getParentUID,
  getParentKravUID,
  getKravUID,
  getConnectedEntityUID,
  getEntityDisplayName,
  getEntityID,
  hasParent,
  resolveFromConfig,
  getAllEntityInfo,
};
