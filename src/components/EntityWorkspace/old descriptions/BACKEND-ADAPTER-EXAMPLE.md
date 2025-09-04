# Backend Adapter Layer - Concrete Example

This shows how the backend adapter layer handles your complex data patterns and transforms them into a clean interface.

## Raw Backend Data Examples

### 1. Grouped Response (from combinedEntityService)
```javascript
// What your backend currently returns
const rawBackendResponse = {
  items: [
    {
      emne: {
        id: 12,
        tittel: "Informasjonssikkerhet",
        sortIt: 1,
        icon: "shield",
        color: "#3B82F6"
      },
      entities: [
        {
          id: 45,
          entityType: "krav",
          kravUID: "KRAV001",
          tittel: "Dokumentere informasjonssikkerhet",
          beskrivelse: {
            type: "doc",
            content: [
              {
                type: "paragraph", 
                content: [{ type: "text", text: "Bedriften skal dokumentere sine informasjonssikkerhetsrutiner" }]
              }
            ]
          },
          obligatorisk: true,
          status: { id: 1, navn: "Aktiv", color: "#10B981" },
          vurdering: { id: 2, navn: "Høy risiko", color: "#EF4444" },
          prioritet: 10,
          emneId: 12,
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-20T14:22:00Z",
          createdBy: "user123",
          tiltak: [
            {
              id: 78,
              tiltakUID: "TILTAK001", 
              navn: "Implementere sikkerhetspolicy",
              beskrivelse: "Utvikle og implementere informasjonssikkerhetspolicy"
            }
          ]
        },
        {
          id: 78,
          entityType: "tiltak",
          tiltakUID: "TILTAK001",
          navn: "Implementere sikkerhetspolicy", 
          beskrivelse: "Utvikle og implementere informasjonssikkerhetspolicy",
          status: { id: 2, navn: "Under arbeid", color: "#F59E0B" },
          prioritet: 15,
          emneId: 12,
          krav: [
            { id: 45, kravUID: "KRAV001", tittel: "Dokumentere informasjonssikkerhet" }
          ],
          _displayedUnderKrav: true,
          _relatedToKrav: 45,
          _parentKrav: {
            id: 45,
            kravUID: "KRAV001",
            tittel: "Dokumentere informasjonssikkerhet"
          }
        }
      ]
    },
    {
      emne: {
        id: 8,
        tittel: "Personvern",
        sortIt: 2,
        icon: "user-check",
        color: "#8B5CF6"
      },
      entities: [
        {
          id: 92,
          entityType: "krav", 
          kravUID: "KRAV002",
          tittel: "GDPR compliance",
          beskrivelse: "Implementere GDPR-krav for personvernhåndtering",
          obligatorisk: true,
          status: { id: 1, navn: "Aktiv", color: "#10B981" },
          prioritet: 5,
          emneId: 8
        }
      ]
    }
  ],
  totalCount: 3,
  page: 1,
  pageSize: 10,
  totalPages: 1
};
```

### 2. Simple Paginated Response
```javascript
// Alternative backend response format
const simplePaginatedResponse = {
  items: [
    {
      id: 45,
      kravUID: "KRAV001",
      tittel: "Dokumentere informasjonssikkerhet",
      beskrivelse: "Bedriften skal dokumentere sine informasjonssikkerhetsrutiner",
      obligatorisk: true,
      status: { id: 1, navn: "Aktiv", color: "#10B981" },
      emne: { id: 12, tittel: "Informasjonssikkerhet" }
    },
    {
      id: 78, 
      tiltakUID: "TILTAK001",
      navn: "Implementere sikkerhetspolicy",
      beskrivelse: "Utvikle og implementere informasjonssikkerhetspolicy",
      status: { id: 2, navn: "Under arbeid", color: "#F59E0B" }
    }
  ],
  total: 156,
  page: 1,
  pageSize: 10
};
```

## Backend Adapter Implementation

```javascript
class EntityWorkspaceBackendAdapter extends BackendAdapter {
  transformResponse(rawData) {
    console.log("🔄 Raw backend data:", rawData);
    
    // Handle grouped response (from combinedEntityService)
    if (this._isGroupedResponse(rawData)) {
      const transformed = this._transformGroupedResponse(rawData);
      console.log("✅ Transformed grouped data:", transformed);
      return transformed;
    }
    
    // Handle simple paginated response
    if (this._isPaginatedResponse(rawData)) {
      const transformed = this._transformPaginatedResponse(rawData);
      console.log("✅ Transformed paginated data:", transformed);
      return transformed;
    }
    
    // Handle plain array
    if (Array.isArray(rawData)) {
      const transformed = {
        items: rawData.map(item => this.transformEntity(item)),
        total: rawData.length,
        page: 1,
        pageSize: rawData.length,
        isGrouped: false
      };
      console.log("✅ Transformed array data:", transformed);
      return transformed;
    }
    
    throw new Error("Unknown response format");
  }
  
  transformEntity(rawEntity) {
    if (!rawEntity) return null;
    
    // Detect entity type from various clues
    const entityType = this._detectEntityType(rawEntity);
    
    // Create standardized entity
    const standardEntity = {
      // Core fields - always the same
      id: rawEntity.id,
      entityType: entityType,
      
      // Normalized display fields
      title: this._extractTitle(rawEntity),
      description: this._extractDescription(rawEntity), 
      uid: this._extractUID(rawEntity, entityType),
      
      // Normalized status fields
      status: this._normalizeStatus(rawEntity.status),
      vurdering: this._normalizeVurdering(rawEntity.vurdering),
      prioritet: rawEntity.prioritet || null,
      obligatorisk: rawEntity.obligatorisk || false,
      
      // Normalized category/subject
      emne: this._normalizeEmne(rawEntity.emne),
      emneId: rawEntity.emneId || rawEntity.emne?.id || null,
      
      // Relationships - always arrays
      parent: rawEntity.parent ? this.transformEntity(rawEntity.parent) : null,
      children: this._normalizeRelationshipArray(rawEntity.children),
      krav: this._normalizeRelationshipArray(rawEntity.krav, "krav"),
      tiltak: this._normalizeRelationshipArray(rawEntity.tiltak, "tiltak"), 
      prosjektKrav: this._normalizeRelationshipArray(rawEntity.prosjektKrav, "prosjektKrav"),
      prosjektTiltak: this._normalizeRelationshipArray(rawEntity.prosjektTiltak, "prosjektTiltak"),
      
      // Combined view metadata (preserved as-is)
      _displayedUnderKrav: rawEntity._displayedUnderKrav,
      _relatedToKrav: rawEntity._relatedToKrav,
      _parentKrav: rawEntity._parentKrav ? {
        id: rawEntity._parentKrav.id,
        uid: rawEntity._parentKrav.kravUID || rawEntity._parentKrav.prosjektKravUID,
        title: rawEntity._parentKrav.tittel || rawEntity._parentKrav.navn
      } : null,
      
      // Timestamps
      createdAt: rawEntity.createdAt,
      updatedAt: rawEntity.updatedAt,
      createdBy: rawEntity.createdBy,
      updatedBy: rawEntity.updatedBy,
      
      // Preserve original for edge cases
      _raw: rawEntity
    };
    
    console.log(`🔄 Transformed ${entityType}:`, {
      from: { id: rawEntity.id, title: this._extractTitle(rawEntity) },
      to: { id: standardEntity.id, title: standardEntity.title, uid: standardEntity.uid }
    });
    
    return standardEntity;
  }
  
  // Helper methods
  _detectEntityType(rawEntity) {
    if (rawEntity.entityType) return rawEntity.entityType;
    if (rawEntity.kravUID) return "krav";
    if (rawEntity.tiltakUID) return "tiltak"; 
    if (rawEntity.prosjektKravUID) return "prosjektKrav";
    if (rawEntity.prosjektTiltakUID) return "prosjektTiltak";
    
    // Fallback detection
    if (rawEntity.tittel && rawEntity.obligatorisk !== undefined) return "krav";
    if (rawEntity.navn && !rawEntity.obligatorisk) return "tiltak";
    
    return "unknown";
  }
  
  _extractTitle(rawEntity) {
    return rawEntity.tittel || rawEntity.navn || rawEntity.title || rawEntity.name || "";
  }
  
  _extractDescription(rawEntity) {
    const desc = rawEntity.beskrivelse || rawEntity.description;
    if (!desc) return "";
    
    // Handle TipTap JSON structure
    if (typeof desc === "object" && desc.type === "doc" && desc.content) {
      return this._extractTextFromTipTap(desc);
    }
    
    return String(desc);
  }
  
  _extractTextFromTipTap(tipTapObj) {
    if (!tipTapObj?.content) return "";
    
    let text = "";
    tipTapObj.content.forEach(node => {
      if (node.type === "paragraph" && node.content) {
        node.content.forEach(textNode => {
          if (textNode.type === "text" && textNode.text) {
            text += textNode.text + " ";
          }
        });
      }
    });
    
    return text.trim();
  }
  
  _extractUID(rawEntity, entityType) {
    // Try specific UID fields first
    const uid = rawEntity.kravUID || rawEntity.tiltakUID || 
                rawEntity.prosjektKravUID || rawEntity.prosjektTiltakUID || 
                rawEntity.uid;
    
    if (uid) return uid;
    
    // Generate fallback UID
    const prefix = {
      krav: "KRAV",
      tiltak: "TILTAK", 
      prosjektKrav: "PKRAV",
      prosjektTiltak: "PTILTAK"
    }[entityType] || "ENT";
    
    return `${prefix}${rawEntity.id}`;
  }
  
  _normalizeStatus(status) {
    if (!status) return null;
    return {
      id: status.id,
      name: status.navn || status.name,
      color: status.color || "#6B7280",
      icon: status.icon
    };
  }
  
  _normalizeVurdering(vurdering) {
    if (!vurdering) return null;
    return {
      id: vurdering.id,
      name: vurdering.navn || vurdering.name,
      color: vurdering.color || "#6B7280", 
      icon: vurdering.icon
    };
  }
  
  _normalizeEmne(emne) {
    if (!emne) return null;
    return {
      id: emne.id,
      title: emne.tittel || emne.title,
      icon: emne.icon,
      color: emne.color,
      sortIt: emne.sortIt
    };
  }
  
  _normalizeRelationshipArray(items, entityType = null) {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => ({
      id: item.id,
      entityType: entityType || this._detectEntityType(item),
      title: this._extractTitle(item),
      uid: this._extractUID(item, entityType),
      // Include enough data for basic display
      status: this._normalizeStatus(item.status),
      _raw: item
    }));
  }
  
  _isGroupedResponse(rawData) {
    return rawData?.items && 
           Array.isArray(rawData.items) && 
           rawData.items[0]?.emne && 
           rawData.items[0]?.entities;
  }
  
  _isPaginatedResponse(rawData) {
    return rawData?.items && 
           rawData?.total !== undefined && 
           !rawData.items[0]?.emne;
  }
  
  _transformGroupedResponse(rawData) {
    const transformedGroups = rawData.items.map(group => ({
      emne: this._normalizeEmne(group.emne),
      entities: group.entities.map(entity => this.transformEntity(entity)),
      
      // Maintain backward compatibility
      krav: group.entities
        .filter(e => e.entityType === "krav" || e.entityType === "prosjektKrav")
        .map(entity => this.transformEntity(entity)),
      tiltak: group.entities
        .filter(e => e.entityType === "tiltak" || e.entityType === "prosjektTiltak") 
        .map(entity => this.transformEntity(entity))
    }));
    
    return {
      items: transformedGroups,
      total: rawData.totalCount || rawData.total,
      page: rawData.page,
      pageSize: rawData.pageSize,
      totalPages: rawData.totalPages,
      isGrouped: true
    };
  }
  
  _transformPaginatedResponse(rawData) {
    return {
      items: rawData.items.map(item => this.transformEntity(item)),
      total: rawData.total,
      page: rawData.page, 
      pageSize: rawData.pageSize,
      isGrouped: false
    };
  }
}
```

## Standardized Output

### What Components Receive (Always the Same Format)

```javascript
// Standardized format that components always work with
const standardizedData = {
  items: [
    {
      // Core fields - always consistent
      id: 45,
      entityType: "krav", 
      title: "Dokumentere informasjonssikkerhet",
      description: "Bedriften skal dokumentere sine informasjonssikkerhetsrutiner",
      uid: "KRAV001",
      
      // Status - always normalized
      status: { id: 1, name: "Aktiv", color: "#10B981" },
      vurdering: { id: 2, name: "Høy risiko", color: "#EF4444" },
      prioritet: 10,
      obligatorisk: true,
      
      // Category - always normalized
      emne: { id: 12, title: "Informasjonssikkerhet", sortIt: 1, icon: "shield", color: "#3B82F6" },
      emneId: 12,
      
      // Relationships - always arrays, always normalized
      parent: null,
      children: [],
      krav: [],
      tiltak: [
        {
          id: 78,
          entityType: "tiltak",
          title: "Implementere sikkerhetspolicy",
          uid: "TILTAK001",
          status: { id: 2, name: "Under arbeid", color: "#F59E0B" },
          _raw: { /* original tiltak data */ }
        }
      ],
      prosjektKrav: [],
      prosjektTiltak: [],
      
      // Combined view metadata (when applicable)
      _displayedUnderKrav: undefined,
      _relatedToKrav: undefined,
      _parentKrav: null,
      
      // Timestamps
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-20T14:22:00Z",
      createdBy: "user123",
      
      // Original data preserved
      _raw: { /* complete original backend object */ }
    },
    {
      id: 78,
      entityType: "tiltak",
      title: "Implementere sikkerhetspolicy", 
      description: "Utvikle og implementere informasjonssikkerhetspolicy",
      uid: "TILTAK001",
      
      status: { id: 2, name: "Under arbeid", color: "#F59E0B" },
      vurdering: null,
      prioritet: 15,
      obligatorisk: false,
      
      emne: { id: 12, title: "Informasjonssikkerhet", sortIt: 1 },
      emneId: 12,
      
      parent: null,
      children: [],
      krav: [
        {
          id: 45,
          entityType: "krav", 
          title: "Dokumentere informasjonssikkerhet",
          uid: "KRAV001",
          _raw: { /* original krav data */ }
        }
      ],
      tiltak: [],
      
      // Combined view metadata
      _displayedUnderKrav: true,
      _relatedToKrav: 45,
      _parentKrav: {
        id: 45,
        uid: "KRAV001", 
        title: "Dokumentere informasjonssikkerhet"
      },
      
      _raw: { /* complete original backend object */ }
    }
  ],
  total: 156,
  page: 1,
  pageSize: 10,
  isGrouped: true
};
```

## Usage in Components

```javascript
// Components only work with standardized data
const EntityListRow = ({ entity }) => {
  // Always works the same way regardless of backend format
  const title = entity.title; // Always 'title', never 'tittel' or 'navn'
  const uid = entity.uid; // Always 'uid', properly generated
  const description = entity.description; // Always plain text, TipTap handled
  const status = entity.status?.name; // Always normalized structure
  
  return (
    <div>
      <span className="uid">{uid}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {status && <span className="status" style={{color: entity.status.color}}>{status}</span>}
    </div>
  );
};

// Usage with adapter
const kravInterface = new EntityInterface("krav", kravConfig, {
  backendAdapter: new EntityWorkspaceBackendAdapter("krav", kravConfig)
});

// Components receive clean data
const data = await kravInterface.fetchData();
// data.items are always in standardized format
```

## Benefits Demonstrated

1. **Hides Complexity**: Components never see `tittel` vs `title`, TipTap JSON, or inconsistent structures
2. **Consistent Interface**: All entities have same field names and structures
3. **Preserves Functionality**: Complex metadata like `_displayedUnderKrav` still available
4. **Testable**: Can test adapter separately with mock backend data
5. **Flexible**: Can swap adapters for different backends without changing components

The adapter layer acts as a **translation service** between your complex backend patterns and clean component interfaces!