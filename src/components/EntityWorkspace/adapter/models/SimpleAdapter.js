/**
 * Simple Backend Adapter - For basic REST API patterns
 * Provides minimal transformation for standard entity structures
 */

import { BaseAdapter } from '../core/BaseAdapter.js';

export class SimpleAdapter extends BaseAdapter {
  constructor(entityType, config = {}) {
    super(entityType, config);
  }

  /**
   * Transform simple backend response to standard format
   */
  transformResponse(rawData) {
    if (!rawData) {
      return this.createStandardResponse([], {});
    }

    // Handle array of entities
    if (Array.isArray(rawData)) {
      const transformedItems = rawData.map(item => this.transformEntity(item));
      return this.createStandardResponse(transformedItems, { totalCount: rawData.length });
    }

    // Handle paginated response
    if (rawData.items && Array.isArray(rawData.items)) {
      const transformedItems = rawData.items.map(item => this.transformEntity(item));
      return this.createStandardResponse(transformedItems, rawData);
    }

    // Handle single entity
    const transformedEntity = this.transformEntity(rawData);
    return this.createStandardResponse([transformedEntity], { totalCount: 1 });
  }

  /**
   * Transform single entity to standard format (minimal transformation)
   */
  transformEntity(rawEntity) {
    if (!rawEntity) return null;

    return {
      // Core identifiers
      id: rawEntity.id,
      entityType: this.entityType,
      uid: rawEntity.uid || `${this.entityType.toUpperCase()}${rawEntity.id}`,
      
      // Display fields
      title: rawEntity.title || rawEntity.name || rawEntity.tittel || rawEntity.navn || "",
      description: rawEntity.description || rawEntity.beskrivelse || "",
      
      // Basic status
      status: this.normalizeStatusObject(rawEntity.status),
      prioritet: rawEntity.prioritet || rawEntity.priority,
      obligatorisk: Boolean(rawEntity.obligatorisk || rawEntity.required),
      
      // Simple relationships
      parentId: rawEntity.parentId,
      parent: rawEntity.parent ? this.transformEntity(rawEntity.parent) : null,
      children: Array.isArray(rawEntity.children) ? 
        rawEntity.children.map(child => this.transformEntity(child)) : [],
      
      // System fields
      createdAt: rawEntity.createdAt,
      updatedAt: rawEntity.updatedAt,
      createdBy: rawEntity.createdBy,
      updatedBy: rawEntity.updatedBy,
      
      // Preserve original data
      _raw: rawEntity
    };
  }

  /**
   * Transform standard entity back to simple backend format
   */
  transformRequest(standardEntity) {
    if (!standardEntity) return null;

    return {
      id: standardEntity.id,
      title: standardEntity.title,
      description: standardEntity.description,
      priority: standardEntity.prioritet,
      required: standardEntity.obligatorisk,
      parentId: standardEntity.parentId,
      
      // Include status ID if available
      statusId: standardEntity.status?.id
    };
  }
}