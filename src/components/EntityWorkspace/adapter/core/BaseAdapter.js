/**
 * Base Backend Adapter - Abstract base class for all entity adapters
 * Provides common functionality and enforces interface contracts
 */
export class BaseAdapter {
  constructor(entityType, config = {}) {
    this.entityType = entityType;
    this.config = config;
    
    // Validate required methods are implemented
    if (this.constructor === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }
  }

  // Abstract methods that must be implemented by subclasses
  transformResponse(rawData) {
    throw new Error('transformResponse must be implemented by subclass');
  }

  transformEntity(rawEntity) {
    throw new Error('transformEntity must be implemented by subclass');
  }

  transformRequest(standardData) {
    throw new Error('transformRequest must be implemented by subclass');
  }

  // Concrete utility methods available to all adapters
  
  /**
   * Extract text content from TipTap JSON structure
   */
  extractTextFromTipTap(tipTapObj) {
    if (!tipTapObj) return "";
    if (typeof tipTapObj === "string") return tipTapObj;
    if (typeof tipTapObj !== "object") return "";
    
    let text = "";
    if (tipTapObj.content && Array.isArray(tipTapObj.content)) {
      tipTapObj.content.forEach(node => {
        if (node.type === "paragraph" && node.content) {
          node.content.forEach(textNode => {
            if (textNode.type === "text" && textNode.text) {
              text += textNode.text + " ";
            }
          });
        }
      });
    }
    return text.trim();
  }

  /**
   * Normalize description field - handles TipTap JSON or plain text
   */
  normalizeDescription(rawEntity, fieldName = 'beskrivelse') {
    const desc = rawEntity[fieldName];
    if (!desc) return "";
    
    // Use snippet if available
    const snippetField = `${fieldName}Snippet`;
    if (rawEntity[snippetField]) {
      return rawEntity[snippetField];
    }
    
    // Use plain if available
    const plainField = `${fieldName}Plain`;
    if (rawEntity[plainField]) {
      return rawEntity[plainField];
    }
    
    // Handle TipTap JSON
    if (typeof desc === "object" && desc.type === "doc") {
      return this.extractTextFromTipTap(desc);
    }
    
    return String(desc);
  }

  /**
   * Normalize status/vurdering objects
   */
  normalizeStatusObject(statusObj, defaultName = "Ukjent") {
    if (!statusObj) return null;
    
    return {
      id: statusObj.id,
      name: statusObj.navn || statusObj.name || defaultName,
      color: statusObj.color || "#6B7280",
      icon: statusObj.icon,
      sortIt: statusObj.sortIt
    };
  }

  /**
   * Normalize emne/category object
   */
  normalizeEmne(emne) {
    if (!emne) return null;
    
    return {
      id: emne.id,
      title: emne.tittel || emne.title || emne.navn || emne.name,
      icon: emne.icon,
      color: emne.color,
      sortIt: emne.sortIt
    };
  }

  /**
   * Normalize user/creator objects
   */
  normalizeUser(user) {
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.navn || user.name,
      email: user.epost || user.email
    };
  }

  /**
   * Normalize relationship arrays (children, krav, tiltak, etc.)
   */
  normalizeRelationshipArray(items, entityType = null) {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => ({
      id: item.id,
      entityType: entityType || this.detectEntityType(item),
      title: this.extractTitle(item),
      uid: this.extractUID(item, entityType),
      description: item.beskrivelseSnippet || this.normalizeDescription(item),
      // Include minimal status for display
      status: this.normalizeStatusObject(item.status),
      obligatorisk: item.obligatorisk,
      prioritet: item.prioritet,
      _raw: item
    }));
  }

  /**
   * Detect entity type from various clues in the data
   */
  detectEntityType(rawEntity) {
    if (!rawEntity) return "unknown";
    
    // Explicit entityType field
    if (rawEntity.entityType) return rawEntity.entityType;
    
    // Detect from UID fields
    if (rawEntity.kravUID) {
      // Check if it's project-specific
      return rawEntity.projectId ? "prosjektKrav" : "krav";
    }
    if (rawEntity.tiltakUID) {
      // Check if it's project-specific  
      return rawEntity.projectId ? "prosjektTiltak" : "tiltak";
    }
    
    // Detect from unique fields
    if (rawEntity.kravreferanse !== undefined || rawEntity.kravreferanseType !== undefined) {
      return rawEntity.projectId ? "prosjektKrav" : "krav";
    }
    if (rawEntity.implementasjon !== undefined || rawEntity.tilbakemelding !== undefined) {
      return rawEntity.projectId ? "prosjektTiltak" : "tiltak";
    }
    
    return "unknown";
  }

  /**
   * Extract title from various title fields
   */
  extractTitle(rawEntity) {
    return rawEntity.tittel || rawEntity.navn || rawEntity.title || rawEntity.name || "";
  }

  /**
   * Extract UID from various UID fields or generate fallback
   */
  extractUID(rawEntity, entityType = null) {
    // Try specific UID fields first
    const uid = rawEntity.kravUID || rawEntity.tiltakUID || rawEntity.uid;
    if (uid) return uid;
    
    // Generate fallback UID based on entity type
    const detectedType = entityType || this.detectEntityType(rawEntity);
    const prefix = {
      krav: "GK",
      tiltak: "GT", 
      prosjektKrav: "PK",
      prosjektTiltak: "PT"
    }[detectedType] || "ENT";
    
    return `${prefix}${rawEntity.id}`;
  }

  /**
   * Check if response structure is grouped by emne
   */
  isGroupedResponse(rawData) {
    return !!(rawData?.items && 
           Array.isArray(rawData.items) && 
           rawData.items.length > 0 &&
           rawData.items[0]?.emne && 
           (rawData.items[0]?.krav || 
            rawData.items[0]?.tiltak || 
            rawData.items[0]?.prosjektkrav || 
            rawData.items[0]?.prosjekttiltak ||
            rawData.items[0]?.entities));
  }

  /**
   * Check if response structure is paginated
   */
  isPaginatedResponse(rawData) {
    return rawData?.items && 
           rawData?.totalCount !== undefined && 
           !this.isGroupedResponse(rawData);
  }

  /**
   * Standardize response format
   */
  createStandardResponse(items, rawData, isGrouped = false) {
    return {
      items,
      total: rawData.totalCount || rawData.total || items.length,
      page: rawData.page || 1,
      pageSize: rawData.pageSize || items.length,
      totalPages: rawData.totalPages || Math.ceil((rawData.totalCount || items.length) / (rawData.pageSize || items.length)),
      isGrouped
    };
  }
}