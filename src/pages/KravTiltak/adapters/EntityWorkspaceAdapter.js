/**
 * EntityWorkspace Backend Adapter - Handles complex MOP backend response patterns
 * Transforms various backend response formats into standardized entity structures
 */

import { BaseAdapter } from './BaseAdapter.js';
// EntityTypeResolver removed - using adapter pattern only

export class EntityWorkspaceAdapter extends BaseAdapter {
  constructor(entityType, config = {}) {
    super(entityType, config);
    
    // Entity-specific configurations
    this.entityFieldMappings = {
      krav: {
        titleFields: ['tittel'],
        uidField: 'kravUID',
        descriptionFields: ['beskrivelse'],
        childrenKey: 'children',
        specificFields: ['kravreferanse', 'kravreferanseType', 'informasjon', 'versjon', 'kravStatus', 'merknader']
      },
      tiltak: {
        titleFields: ['tittel', 'navn'],
        uidField: 'tiltakUID', 
        descriptionFields: ['beskrivelse'],
        childrenKey: 'children',
        specificFields: ['implementasjon', 'tilbakemelding', 'merknad', 'generalTiltakId', 'generalTiltak']
      },
      prosjektKrav: {
        titleFields: ['tittel'],
        uidField: 'kravUID',
        descriptionFields: ['beskrivelse'],
        childrenKey: 'children', 
        specificFields: ['kravreferanse', 'kravreferanseType', 'informasjon', 'versjon', 'kravStatus', 'merknader', 'projectId', 'generalKravId']
      },
      prosjektTiltak: {
        titleFields: ['tittel', 'navn'],
        uidField: 'tiltakUID',
        descriptionFields: ['beskrivelse'],
        childrenKey: 'children',
        specificFields: ['implementasjon', 'tilbakemelding', 'merknad', 'projectId', 'generalTiltakId', 'generalTiltak']
      },
      // Handle lowercase variants from backend
      prosjekttiltak: {
        titleFields: ['tittel', 'navn'],
        uidField: 'tiltakUID',
        descriptionFields: ['beskrivelse'],
        childrenKey: 'children',
        specificFields: ['implementasjon', 'tilbakemelding', 'merknad', 'projectId', 'generalTiltakId', 'generalTiltak']
      },
      prosjektkrav: {
        titleFields: ['tittel'],
        uidField: 'kravUID',
        descriptionFields: ['beskrivelse'],
        childrenKey: 'children', 
        specificFields: ['kravreferanse', 'kravreferanseType', 'informasjon', 'versjon', 'kravStatus', 'merknader', 'projectId', 'generalKravId']
      }
    };
  }

  /**
   * Transform backend response to standard format
   */
  transformResponse(rawData) {
    console.log('EntityWorkspaceAdapter: transformResponse called with:', {
      keys: rawData ? Object.keys(rawData) : null,
      hasItems: !!rawData?.items,
      hasCount: !!rawData?.count,
      hasTotalCount: !!rawData?.totalCount,
      isGrouped: this.isGroupedResponse(rawData),
      isPaginated: this.isPaginatedResponse(rawData),
      rawData: rawData
    });

    if (!rawData || (typeof rawData === 'object' && Object.keys(rawData).length === 0)) {
      return this.createStandardResponse([], {});
    }

    // Handle grouped response (e.g., grouped-by-emne endpoints)
    if (this.isGroupedResponse(rawData)) {
      console.log('EntityWorkspaceAdapter: Using grouped response path');
      return this.transformGroupedResponse(rawData);
    }

    // Handle paginated response (check for both totalCount and count)
    if (this.isPaginatedResponse(rawData) || (rawData?.items && (rawData?.count !== undefined || rawData?.totalCount !== undefined))) {
      console.log('EntityWorkspaceAdapter: Using paginated response path');
      return this.transformPaginatedResponse(rawData);
    }

    // Handle plain array
    if (Array.isArray(rawData)) {
      console.log('EntityWorkspaceAdapter: Using plain array path');
      const transformedItems = rawData.map(item => this.transformEntity(item));
      return this.createStandardResponse(transformedItems, { totalCount: rawData.length });
    }

    // Handle single entity
    console.log('EntityWorkspaceAdapter: Using single entity path');
    const transformedEntity = this.transformEntity(rawData);
    return this.createStandardResponse([transformedEntity], { totalCount: 1 });
  }

  /**
   * Transform grouped response (emne-based grouping)
   */
  transformGroupedResponse(rawData) {
    console.log('EntityWorkspaceAdapter: transformGroupedResponse - raw data:', {
      hasItems: !!rawData.items,
      itemCount: rawData.items?.length || 0,
      firstGroupKeys: rawData.items?.[0] ? Object.keys(rawData.items[0]) : []
    });

    // Flatten all entities from all groups into a single array
    const allEntities = [];
    
    rawData.items.forEach((group, groupIndex) => {
      console.log(`EntityWorkspaceAdapter: Processing group ${groupIndex}:`, {
        hasEmne: !!group.emne,
        hasKrav: !!group.krav,
        kravCount: group.krav?.length || 0,
        groupKeys: Object.keys(group)
      });

      const emne = this.normalizeEmne(group.emne);
      
      // Extract entities from all possible entity arrays in the group
      const entities = this.extractEntitiesFromGroup(group);
      
      console.log(`EntityWorkspaceAdapter: Extracted ${entities.length} entities from group ${groupIndex}`);
      if (entities.length > 0) {
        console.log('EntityWorkspaceAdapter: First entity structure:', {
          id: entities[0].id,
          tittel: entities[0].tittel,
          kravUID: entities[0].kravUID,
          keys: Object.keys(entities[0])
        });
      }
      
      // Transform entities and add emne metadata
      entities.forEach(entity => {
        const transformedEntity = this.transformEntity(entity);
        // Add emne information to each entity
        if (emne) {
          transformedEntity.emne = emne;
          transformedEntity._emneId = emne.id;
          transformedEntity._emneName = emne.navn || emne.name;
        }
        allEntities.push(transformedEntity);
      });
    });

    return this.createStandardResponse(allEntities, rawData, false);
  }

  /**
   * Transform paginated response
   */
  transformPaginatedResponse(rawData) {
    console.log('EntityWorkspaceAdapter: transformPaginatedResponse - raw data:', {
      hasItems: !!rawData.items,
      itemCount: rawData.items?.length || 0,
      firstItemKeys: rawData.items?.[0] ? Object.keys(rawData.items[0]) : []
    });
    
    if (rawData.items?.[0]) {
      console.log('EntityWorkspaceAdapter: First item in paginated response:', {
        id: rawData.items[0].id,
        tittel: rawData.items[0].tittel,
        kravUID: rawData.items[0].kravUID,
        keys: Object.keys(rawData.items[0])
      });
    }
    
    const transformedItems = rawData.items.map(item => this.transformEntity(item));
    return this.createStandardResponse(transformedItems, rawData, false);
  }

  /**
   * Extract entities from grouped response structure
   */
  extractEntitiesFromGroup(group) {
    const entities = [];
    
    // Check all possible entity array keys
    const entityKeys = ['entities', 'krav', 'tiltak', 'prosjektkrav', 'prosjekttiltak'];
    
    entityKeys.forEach(key => {
      if (group[key] && Array.isArray(group[key])) {
        entities.push(...group[key]);
      }
    });
    
    return entities;
  }

  /**
   * Check if entity matches a specific type
   */
  isEntityType(entity, expectedType) {
    const detectedType = this.detectEntityType(entity);
    
    // Handle type variations
    const typeMap = {
      krav: ['krav', 'prosjektKrav'],
      tiltak: ['tiltak', 'prosjektTiltak'],
      prosjektKrav: ['prosjektKrav'],
      prosjektTiltak: ['prosjektTiltak']
    };
    
    return typeMap[expectedType]?.includes(detectedType) || detectedType === expectedType;
  }

  /**
   * Transform single entity to standard format
   */
  transformEntity(rawEntity) {
    if (!rawEntity) return null;

    // If entity is already transformed (has 'title' field), return as-is
    if (rawEntity.title !== undefined) {
      return rawEntity;
    }

    // Debug: Log raw entity structure
    console.log('EntityWorkspaceAdapter: Raw entity before transform:', {
      id: rawEntity.id,
      tittel: rawEntity.tittel,
      kravUID: rawEntity.kravUID,
      hasExpectedFields: !!(rawEntity.id && rawEntity.tittel && rawEntity.kravUID),
      allKeys: Object.keys(rawEntity)
    });

    const entityType = this.detectEntityType(rawEntity);
    const mapping = this.entityFieldMappings[entityType] || this.entityFieldMappings.krav;
    
    const standardEntity = {
      // Core identifiers
      id: rawEntity.id,
      entityType: entityType,
      uid: this.extractUID(rawEntity, entityType),
      
      // Display fields
      title: this.extractTitle(rawEntity),
      descriptionCard: rawEntity.beskrivelseSnippet || '',
      descriptionField: rawEntity.beskrivelse || '',
      
      // Status and metadata
      status: this.normalizeStatusObject(rawEntity.status),
      vurdering: this.normalizeStatusObject(rawEntity.vurdering),
      prioritet: rawEntity.prioritet,
      obligatorisk: Boolean(rawEntity.obligatorisk),
      
      // Category/subject
      emne: this.normalizeEmne(rawEntity.emne),
      emneId: rawEntity.emneId,
      
      // Hierarchy
      parentId: rawEntity.parentId,
      parent: rawEntity.parent ? this.transformEntity(rawEntity.parent) : null,
      children: this.normalizeRelationshipArray(rawEntity.children || [], entityType),
      
      // Cross-relationships
      krav: this.normalizeRelationshipArray(rawEntity.krav || [], 'krav'),
      tiltak: this.normalizeRelationshipArray(rawEntity.tiltak || [], 'tiltak'),
      prosjektKrav: this.normalizeRelationshipArray(rawEntity.prosjektKrav || [], 'prosjektKrav'),
      prosjektTiltak: this.normalizeRelationshipArray(rawEntity.prosjektTiltak || [], 'prosjektTiltak'),
      
      // Combined view metadata (preserve for backward compatibility)
      _displayedUnderKrav: rawEntity._displayedUnderKrav,
      _relatedToKrav: rawEntity._relatedToKrav,
      _parentKrav: rawEntity._parentKrav ? {
        id: rawEntity._parentKrav.id,
        uid: rawEntity._parentKrav.kravUID || this.extractUID(rawEntity._parentKrav),
        title: this.extractTitle(rawEntity._parentKrav)
      } : null,
      _orphaned: rawEntity._orphaned,
      
      // Entity-specific fields
      ...this.extractEntitySpecificFields(rawEntity, entityType),
      
      // Project-specific fields (preserve directly)
      projectId: rawEntity.projectId,
      generalKravId: rawEntity.generalKravId,
      generalTiltakId: rawEntity.generalTiltakId,
      
      // System fields
      createdAt: rawEntity.createdAt,
      updatedAt: rawEntity.updatedAt,
      createdBy: rawEntity.createdBy,
      updatedBy: rawEntity.updatedBy,
      creator: this.normalizeUser(rawEntity.creator),
      updater: this.normalizeUser(rawEntity.updater),
      enhet: rawEntity.enhet ? {
        id: rawEntity.enhet.id,
        name: rawEntity.enhet.navn || rawEntity.enhet.name
      } : null,
      
      // Files and attachments
      files: rawEntity.files || [],
      
      // Preserve original data
      _raw: rawEntity
    };

    return standardEntity;
  }

  /**
   * Extract entity-specific fields based on entity type
   */
  extractEntitySpecificFields(rawEntity, entityType) {
    const specificFields = {};
    const mapping = this.entityFieldMappings[entityType];
    
    if (!mapping) return specificFields;
    
    // Extract fields specific to this entity type
    mapping.specificFields?.forEach(fieldName => {
      if (rawEntity[fieldName] !== undefined) {
        // Handle TipTap fields
        if (['implementasjon', 'tilbakemelding', 'informasjon'].includes(fieldName)) {
          specificFields[fieldName] = this.normalizeDescription(rawEntity, fieldName);
        }
        // Handle reference objects
        else if (fieldName === 'kravreferanseType') {
          specificFields[fieldName] = rawEntity[fieldName] ? {
            id: rawEntity[fieldName].id,
            title: rawEntity[fieldName].tittel || rawEntity[fieldName].title
          } : null;
        }
        // Handle general/project relationships
        else if (['generalKrav', 'generalTiltak'].includes(fieldName)) {
          specificFields[fieldName] = rawEntity[fieldName] ? {
            id: rawEntity[fieldName].id,
            uid: rawEntity[fieldName].kravUID || rawEntity[fieldName].tiltakUID || this.extractUID(rawEntity[fieldName]),
            title: this.extractTitle(rawEntity[fieldName])
          } : null;
        }
        // Copy other fields as-is
        else {
          specificFields[fieldName] = rawEntity[fieldName];
        }
      }
    });
    
    return specificFields;
  }

  /**
   * Transform standard entity back to backend request format
   */
  transformRequest(standardEntity) {
    if (!standardEntity) return null;

    const entityType = standardEntity.entityType;
    const backendData = {
      id: standardEntity.id,
      
      // Map title back to backend field
      tittel: standardEntity.title,
      
      // Map description back (using snippet for simplicity)
      beskrivelse: standardEntity.description,
      
      // Map status and metadata
      obligatorisk: standardEntity.obligatorisk,
      prioritet: standardEntity.prioritet,
      emneId: standardEntity.emneId,
      parentId: standardEntity.parentId,
      
      // Map IDs for relationships
      statusId: standardEntity.status?.id,
      vurderingId: standardEntity.vurdering?.id
    };

    // Add entity-specific request fields
    if (entityType === 'prosjektKrav' || entityType === 'prosjektTiltak') {
      backendData.projectId = standardEntity.projectId;
    }

    // Include specific fields that might be needed for updates
    const originalData = standardEntity._raw;
    if (originalData) {
      // Copy fields that should be preserved in requests
      const preserveFields = ['versjon', 'kravStatus', 'merknad', 'merknader', 'kravreferanse', 'kravreferansetypeId'];
      preserveFields.forEach(field => {
        if (originalData[field] !== undefined) {
          backendData[field] = originalData[field];
        }
      });
    }

    return backendData;
  }


  /**
   * Create standardized response format
   */
  createStandardResponse(items, rawData = {}, isGrouped = false) {
    return {
      items: items || [],
      total: rawData.total || items?.length || 0,
      page: rawData.page || 1,
      pageSize: rawData.pageSize || (items?.length || 50),
      totalPages: rawData.totalPages || Math.ceil((rawData.total || items?.length || 0) / (rawData.pageSize || 50)),
      hasNextPage: rawData.hasNextPage || false,
      hasPreviousPage: rawData.hasPreviousPage || false,
      isGrouped: isGrouped,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'EntityWorkspaceAdapter'
      }
    };
  }

  /**
   * Extract title from raw entity
   */
  extractTitle(rawEntity) {
    if (!rawEntity) return 'Uten tittel';
    
    // Try different title fields in order of preference
    return rawEntity.tittel || rawEntity.navn || rawEntity.title || rawEntity.name || 'Uten tittel';
  }

  /**
   * Extract UID from raw entity based on type
   */
  extractUID(rawEntity, entityType = null) {
    if (!rawEntity) return null;
    
    const detectedType = entityType || this.detectEntityType(rawEntity);
    
    // Try different UID fields based on entity type
    if (detectedType.toLowerCase().includes('krav')) {
      return rawEntity.kravUID || rawEntity.prosjektKravUID || rawEntity.id;
    } else if (detectedType.toLowerCase().includes('tiltak')) {
      return rawEntity.tiltakUID || rawEntity.prosjektTiltakUID || rawEntity.id;
    }
    
    // Fallback to common UID fields
    return rawEntity.uid || rawEntity.kravUID || rawEntity.tiltakUID || rawEntity.id;
  }

}