# EntityWorkspace Interface Analysis

## Overview
Analysis of EntityWorkspace components and their potential for standardized interfaces and reusability.

## Current Interface Analysis

### 1. EntityListRow - Already Well-Architected Interface
- **Current**: Highly configurable with `viewOptions` parameter
- **Props Interface**: Clean entity data + config + callbacks
- **Reusability**: Already handles multiple entity types via `modelConfig` resolution
- **Flexibility**: Dynamic field resolution, combined view support, indent logic

### 2. EntityDetailPane - Good Interface Foundation  
- **Current**: Clean entity + config + callback pattern
- **Dynamic Resolution**: Automatically resolves `modelConfig` for combined entities
- **Action System**: Permission-based actions (`canEdit`, `canDelete`, `canCreate`)
- **Form Integration**: Uses `EntityDetailForm` with resolved configuration

### 3. CombinedEntityWorkspace - Pure Interface Pattern
- **Current**: Acts as wrapper/adapter for mixed entity types
- **Pattern**: Takes service + config, creates unified interface
- **Delegation**: Passes through to `EntityWorkspace` with enhanced context
- **Configuration**: Minimal config, relies on dynamic resolution

## Interface Improvement Opportunities

### Proposed: Generic Entity Interface Pattern

```javascript
// Central Entity Interface
interface EntityComponentInterface {
  // Core data
  entity: StandardEntity;
  entities?: StandardEntity[];
  
  // Configuration 
  modelConfig: EntityModelConfig;
  entityType: string;
  
  // Behavior callbacks
  onSelect?: (entity) => void;
  onEdit?: (entity, changes) => void;
  onDelete?: (entity) => void;
  onCreate?: (entityType) => void;
  
  // Display options
  viewOptions?: EntityViewOptions;
  displayResolver?: DisplayResolver;
  
  // Context
  context?: EntityContext;
}
```

### 1. Enhanced EntityListRow Interface
```javascript
// Already good, could be made more generic:
const EntityListRow = ({
  entity,
  config, // Instead of separate modelConfig + entityType
  actions, // Unified action callbacks
  display, // Unified display options
  context, // Additional context (user, permissions, etc.)
}) => {
  // Dynamic resolution based on entity.entityType or config.type
  const resolvedConfig = useEntityConfig(entity, config);
  const resolvedActions = useEntityActions(entity, actions, context);
  const resolvedDisplay = useEntityDisplay(entity, display, context);
  
  return (/* rendered row */);
};
```

### 2. Enhanced EntityDetailPane Interface
```javascript
// Could be more generic:
const EntityDetailPane = ({
  entity,
  config, // Unified config object
  mode, // 'view' | 'edit' | 'create'
  actions, // Unified action system
  context, // User, permissions, etc.
}) => {
  const resolver = useEntityResolver(entity, config);
  const formHandler = useEntityForm(entity, resolver, mode);
  const actionHandler = useEntityActions(entity, actions, context);
  
  return (/* rendered detail pane */);
};
```

### 3. Generic Entity Workspace Interface
```javascript
// Pattern inspired by CombinedEntityWorkspace:
const GenericEntityWorkspace = ({
  entityType,
  service, // Entity service with standard interface
  config, // Workspace configuration
  components, // Override components { ListRow, DetailPane, etc. }
  context, // Additional context
}) => {
  return (
    <EntityWorkspaceCore
      {...resolveEntityConfig(entityType, service, config)}
      components={components}
      context={context}
    />
  );
};
```

## Recommended Interface Improvements

### Phase 1: Standardize Props Interface
1. **Unified Config Object**: Instead of separate `modelConfig + entityType`, use single `config` with type resolution
2. **Action Callbacks Object**: Group `onSave`, `onDelete`, `onCreate` into `actions` object
3. **Context Object**: Pass `user`, `permissions`, additional context as single object

### Phase 2: Generic Component Variants
1. **GenericEntityListRow**: Version that works with any entity type via config
2. **GenericEntityDetailPane**: Version that handles any entity type dynamically  
3. **GenericEntityWorkspace**: Factory pattern like `CombinedEntityWorkspace`

### Phase 3: Composition Interface
```javascript
// Usage example:
<GenericEntityWorkspace
  entityType="custom-reports" 
  service={customReportService}
  config={customReportConfig}
  components={{
    ListRow: CustomReportRow,
    DetailPane: CustomReportDetail,
    Filters: CustomReportFilters
  }}
/>
```

## CombinedView as Interface Model

**CombinedEntityWorkspace** is already a great example of this pattern:
- **Service Abstraction**: Takes any service that implements the interface
- **Config Wrapper**: Creates unified config from service capabilities  
- **Component Delegation**: Passes through to core component with enhanced context
- **Type Safety**: Handles mixed types through dynamic resolution

This pattern could be **generalized** for any entity type:

```javascript
const EntityWorkspaceFactory = ({
  entityType,
  service,
  config,
  customizations = {}
}) => {
  const unifiedConfig = createUnifiedConfig(entityType, service, config);
  const enhancedContext = createEntityContext(entityType, customizations);
  
  return (
    <EntityWorkspaceCore
      modelConfig={unifiedConfig}
      entityType={entityType}
      context={enhancedContext}
      {...customizations}
    />
  );
};
```

**Bottom line**: Your components are already well-designed for reusability. The main opportunity is standardizing the interface contracts and creating generic factory patterns like your CombinedView approach.

## Utils, Store, Filters & Services Interface Analysis

After analyzing the supporting architecture, here's how well they work with interface design:

### **Utils Layer - Excellent Interface Foundation** ⭐⭐⭐⭐⭐

#### **1. EntityTypeTranslator - Perfect Interface Pattern**
```javascript
// Clean, static interface with format conversion
EntityTypeTranslator.translate(entityType, "camelCase|kebab-case|lowercase|api")
EntityTypeTranslator.isProjectEntity(entityType)
EntityTypeTranslator.getDisplayName(entityType, plural)
```
- **Strengths**: Pure functions, single responsibility, consistent naming
- **Interface Quality**: Excellent - could be used anywhere
- **Reusability**: 100% - no dependencies, just utility functions

#### **2. uidUtils - Very Good Configuration-Driven Interface**
```javascript
// Flexible resolution with fallbacks
const uid = getEntityUID(entity, entityType);
const info = getAllEntityInfo(entity, entityType);
const resolved = resolveFromConfig(entity, config);
```
- **Strengths**: Configuration-based resolution, supports multiple entity types
- **Interface Quality**: Very good - clean function signatures
- **Reusability**: High - works with any entity structure

#### **3. optimisticUpdates - Complex but Well-Structured**
- **Current**: 864 lines of cache management complexity
- **Interface**: Multiple specialized functions for different scenarios
- **Challenge**: Too specialized, hard to use outside EntityWorkspace
- **Improvement Need**: Could benefit from simplified interface wrapper

### **Store Layer - Good Centralized Interface** ⭐⭐⭐⭐

#### **entityWorkspaceStore - Comprehensive State Management**
```javascript
// Clean action-based interface
const { 
  initializeWorkspace, 
  handleSave, 
  handleDelete, 
  applyFilters, 
  getFilteringInfo 
} = useEntityWorkspaceStore();
```
- **Strengths**: Single source of truth, action-based interface, type resolution
- **Interface Quality**: Good - consistent action patterns
- **Reusability**: Medium - some EntityWorkspace-specific logic
- **Improvement Need**: Could extract generic entity state management

### **Services Layer - Mixed Interface Quality** ⭐⭐⭐

#### **1. EntityTypeResolver - Excellent Service Interface** ⭐⭐⭐⭐⭐
```javascript
// Perfect service pattern - clean, focused, reusable
EntityTypeResolver.resolveModelConfig(entityType)
EntityTypeResolver.resolveApiConfig(entityType, modelConfig)
EntityTypeResolver.supportsFeature(entityType, feature, modelConfig)
EntityTypeResolver.detectEntityType(entity)
```
- **Strengths**: Pure static methods, single responsibility per method
- **Interface Quality**: Excellent - could be used in any system
- **Pattern**: Factory/Resolver pattern - perfect for interfaces

#### **2. EntityFilterService - Very Good Filtering Interface** ⭐⭐⭐⭐
```javascript
// Clean data processing interface
EntityFilterService.extractAvailableFilters(items, entityType)
EntityFilterService.applyFilters(items, filters, entityType, groupByEmne)
EntityFilterService.calculateStats(items, entityType, groupByEmne)
```
- **Strengths**: Pure functions, handles multiple entity types
- **Interface Quality**: Very good - stateless and predictable
- **Reusability**: High - works with any data structure

### **Interface Assessment Summary**

#### **Excellent Interface Candidates** (Ready for Reuse)
1. **EntityTypeTranslator** - Perfect utility interface
2. **EntityTypeResolver** - Perfect service interface  
3. **EntityFilterService** - Very good data processing interface
4. **uidUtils** - Very good configuration-driven interface

#### **Good Interface Candidates** (Minor Improvements Needed)
1. **entityWorkspaceStore** - Good but could be more generic
2. **EntityListRow** - Already well-designed
3. **EntityDetailPane** - Good foundation with dynamic resolution

#### **Complex Interface Challenges**
1. **optimisticUpdates** - Too specialized, needs wrapper interface
2. **CombinedEntityWorkspace** - Good pattern but limited scope

### **Recommended Interface Improvements**

#### **Phase 1: Standardize Excellent Interfaces**
```javascript
// Create unified entity interface using existing excellent services
class EntityInterface {
  constructor(entityType, config) {
    this.type = EntityTypeTranslator.translate(entityType, "camelCase");
    this.config = EntityTypeResolver.resolveModelConfig(this.type);
    this.api = EntityTypeResolver.resolveApiConfig(this.type, this.config);
    this.features = this._resolveFeatures();
  }
  
  // Unified data operations
  processData(items) {
    return EntityFilterService.applyFilters(items, this.filters, this.type);
  }
  
  // Unified entity operations  
  getUID(entity) {
    return uidUtils.getEntityUID(entity, this.type);
  }
  
  // Unified display
  getDisplayName(plural = false) {
    return EntityTypeResolver.getDisplayName(this.type, this.config, plural);
  }
}
```

#### **Phase 2: Simplify Complex Interfaces**
```javascript
// Wrapper for optimisticUpdates complexity
class EntityCacheManager {
  constructor(queryClient, entityType) {
    this.queryClient = queryClient;
    this.entityType = entityType;
  }
  
  update(entity, changes) {
    // Simplify optimistic update complexity behind clean interface
    return handleOptimisticEntityUpdate({
      queryClient: this.queryClient,
      updatedData: changes,
      originalData: entity,
      entityType: this.entityType
    });
  }
}
```

#### **Phase 3: Generic Component Factory**
```javascript
// Use excellent interfaces to create generic components
const createEntityWorkspace = (entityType, options = {}) => {
  const entityInterface = new EntityInterface(entityType, options.config);
  const cacheManager = new EntityCacheManager(options.queryClient, entityType);
  
  return {
    ListRow: (props) => <GenericEntityListRow 
      {...props} 
      entityInterface={entityInterface} 
    />,
    DetailPane: (props) => <GenericEntityDetailPane 
      {...props} 
      entityInterface={entityInterface}
      cacheManager={cacheManager}
    />,
    Workspace: (props) => <GenericEntityWorkspace 
      {...props}
      entityInterface={entityInterface}
      cacheManager={cacheManager}
    />
  };
};
```

### **Key Insights**

1. **Your utilities are already excellent interfaces** - EntityTypeTranslator, EntityTypeResolver, and EntityFilterService are perfectly designed for reuse

2. **The complexity is well-contained** - optimisticUpdates complexity doesn't leak into other components

3. **Service layer follows good patterns** - Resolver/Factory patterns make them very reusable

4. **Store could be more generic** - Current store has good patterns but some EntityWorkspace-specific logic

5. **Components are already well-architected** - They use the excellent services properly

**Bottom Line**: Your supporting architecture is surprisingly well-designed for interfaces. The excellent utilities and services could easily power a generic entity system, and the complex parts are well-contained.

## Plugin Architecture for Specialized Components

For handling store, optimistic updates, and filters as reusable components, a plugin system provides the best approach:

### **Core Interface + Plugin System**
```javascript
// Core interface stays clean
class EntityInterface {
  constructor(entityType, config, plugins = {}) {
    this.type = EntityTypeTranslator.translate(entityType, "camelCase");
    this.config = EntityTypeResolver.resolveModelConfig(this.type);
    this.api = EntityTypeResolver.resolveApiConfig(this.type, this.config);
    
    // Plugin system
    this.plugins = {
      store: plugins.store || new DefaultStorePlugin(),
      cache: plugins.cache || new DefaultCachePlugin(), 
      filters: plugins.filters || new DefaultFiltersPlugin(),
      ...plugins.custom
    };
  }
}
```

### **1. Store Plugin System**
```javascript
// Base store interface
class StorePlugin {
  initialize(entityType, config) {}
  getState() {}
  updateState(changes) {}
  getActions() {}
}

// EntityWorkspace store plugin
class EntityWorkspaceStorePlugin extends StorePlugin {
  constructor() {
    super();
    this.store = useEntityWorkspaceStore;
  }
  
  initialize(entityType, config) {
    const { initializeWorkspace } = this.store.getState();
    initializeWorkspace(entityType, config.modelConfig, config.workspaceConfig);
  }
  
  getState() {
    return this.store((state) => ({
      selectedEntity: state.selectedEntity,
      searchQuery: state.searchQuery,
      filterBy: state.filterBy,
      additionalFilters: state.additionalFilters,
      // ... other state
    }));
  }
  
  getActions() {
    return this.store((state) => ({
      handleSearch: state.handleSearch,
      handleFilterChange: state.handleFilterChange,
      handleSave: state.handleSave,
      // ... other actions
    }));
  }
}

// Simple store plugin for other use cases
class SimpleStorePlugin extends StorePlugin {
  constructor(initialState = {}) {
    super();
    this.state = initialState;
    this.listeners = new Set();
  }
  
  getState() {
    return this.state;
  }
  
  updateState(changes) {
    this.state = { ...this.state, ...changes };
    this.listeners.forEach(listener => listener(this.state));
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

### **2. Optimistic Updates Plugin System**
```javascript
// Base cache interface
class CachePlugin {
  constructor(queryClient, entityType) {
    this.queryClient = queryClient;
    this.entityType = entityType;
  }
  
  update(entity, changes) {}
  invalidate(queries) {}
}

// EntityWorkspace optimistic updates plugin
class OptimisticUpdatesPlugin extends CachePlugin {
  update(entity, changes) {
    // Wrap the complex optimisticUpdates logic
    return handleOptimisticEntityUpdate({
      queryClient: this.queryClient,
      queryKey: [this.entityType, "workspace", "paginated"],
      updatedData: changes,
      originalData: entity,
      entityType: this.entityType
    });
  }
  
  // Specific methods for complex scenarios
  updateCombined(entity, changes) {
    return applyOptimisticUpdateCombined(
      this.queryClient, 
      changes, 
      entity
    );
  }
  
  handleEmnePropagation(updatedData, originalData) {
    return handleEmnePropagationInvalidation(
      this.queryClient, 
      updatedData, 
      originalData, 
      this.entityType
    );
  }
}

// Simple cache plugin for basic use cases
class SimpleCachePlugin extends CachePlugin {
  update(entity, changes) {
    // Basic cache invalidation only
    this.queryClient.setQueryData(
      [this.entityType, entity.id], 
      { ...entity, ...changes }
    );
    this.invalidate([this.entityType]);
  }
  
  invalidate(queries) {
    queries.forEach(query => {
      this.queryClient.invalidateQueries({ queryKey: [query] });
    });
  }
}
```

### **3. Filters Plugin System**
```javascript
// Base filters interface
class FiltersPlugin {
  extractAvailableFilters(items, entityType) {}
  applyFilters(items, filters, entityType, options) {}
  calculateStats(filteredItems, entityType, options) {}
}

// EntityWorkspace filters plugin
class EntityFiltersPlugin extends FiltersPlugin {
  extractAvailableFilters(items, entityType) {
    return EntityFilterService.extractAvailableFilters(items, entityType);
  }
  
  applyFilters(items, filters, entityType, options = {}) {
    return EntityFilterService.applyFilters(
      items, 
      filters, 
      entityType, 
      options.groupByEmne || false
    );
  }
  
  calculateStats(filteredItems, entityType, options = {}) {
    return EntityFilterService.calculateStats(
      filteredItems, 
      entityType, 
      options.groupByEmne || false
    );
  }
}

// Simple filters plugin for basic filtering
class SimpleFiltersPlugin extends FiltersPlugin {
  applyFilters(items, filters) {
    return items.filter(item => {
      if (filters.search && !item.name?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      return true;
    });
  }
  
  calculateStats(filteredItems) {
    return { total: filteredItems.length };
  }
}
```

### **4. Plugin Usage Examples**

```javascript
// EntityWorkspace with full plugin support
const entityWorkspaceInterface = new EntityInterface("krav", config, {
  store: new EntityWorkspaceStorePlugin(),
  cache: new OptimisticUpdatesPlugin(queryClient, "krav"),
  filters: new EntityFiltersPlugin(),
});

// Simple interface for basic use cases
const simpleInterface = new EntityInterface("reports", config, {
  store: new SimpleStorePlugin({ items: [], selectedItem: null }),
  cache: new SimpleCachePlugin(queryClient, "reports"),
  filters: new SimpleFiltersPlugin(),
});

// Custom interface with mixed plugins
const customInterface = new EntityInterface("notifications", config, {
  store: new EntityWorkspaceStorePlugin(), // Reuse complex store
  cache: new SimpleCachePlugin(queryClient, "notifications"), // Simple cache
  filters: new SimpleFiltersPlugin(), // Simple filters
  custom: {
    notifications: new NotificationPlugin(),
    realtime: new RealtimePlugin(),
  }
});
```

### **5. Plugin-Aware Components**

```javascript
// Generic component that works with any plugin combination
const GenericEntityWorkspace = ({ 
  entityInterface, 
  components = {},
  ...props 
}) => {
  const storeState = entityInterface.plugins.store.getState();
  const storeActions = entityInterface.plugins.store.getActions();
  
  const handleSave = async (entity, changes) => {
    // Use cache plugin for optimistic updates
    entityInterface.plugins.cache.update(entity, changes);
    
    // Use store plugin for state management
    return storeActions.handleSave?.(changes) || defaultSave(entity, changes);
  };
  
  const processData = (items) => {
    // Use filters plugin for data processing
    return entityInterface.plugins.filters.applyFilters(
      items, 
      storeState.filters, 
      entityInterface.type,
      { groupByEmne: storeState.groupByEmne }
    );
  };
  
  return (
    <EntityWorkspaceCore
      entityInterface={entityInterface}
      onSave={handleSave}
      processData={processData}
      {...props}
    />
  );
};
```

### **6. Factory Pattern with Plugin Presets**

```javascript
// Preset configurations for common scenarios
const EntityWorkspaceFactory = {
  // Full EntityWorkspace experience
  full: (entityType, config, options = {}) => new EntityInterface(entityType, config, {
    store: new EntityWorkspaceStorePlugin(),
    cache: new OptimisticUpdatesPlugin(options.queryClient, entityType),
    filters: new EntityFiltersPlugin(),
  }),
  
  // Simple CRUD interface
  simple: (entityType, config, options = {}) => new EntityInterface(entityType, config, {
    store: new SimpleStorePlugin(),
    cache: new SimpleCachePlugin(options.queryClient, entityType),
    filters: new SimpleFiltersPlugin(),
  }),
  
  // Custom mix
  custom: (entityType, config, plugins) => new EntityInterface(entityType, config, plugins),
};

// Usage
const kravWorkspace = EntityWorkspaceFactory.full("krav", kravConfig, { queryClient });
const simpleReports = EntityWorkspaceFactory.simple("reports", reportsConfig, { queryClient });
```

## **Benefits of This Plugin Architecture:**

1. **Clean Core Interface**: EntityInterface stays simple and focused
2. **Reusable Complexity**: EntityWorkspace plugins can be reused in other contexts
3. **Flexible Mixing**: Can use EntityWorkspace store with simple cache, etc.
4. **Easy Testing**: Each plugin can be tested independently
5. **Gradual Adoption**: Can start simple and add complexity as needed
6. **Custom Extensions**: Easy to add domain-specific plugins

## **Migration Path:**

1. **Phase 1**: Extract current store/cache/filters logic into plugins
2. **Phase 2**: Create simple plugin variants for basic use cases  
3. **Phase 3**: Build generic components that work with any plugin combination
4. **Phase 4**: Create factory presets for common scenarios

This approach lets you keep the sophisticated EntityWorkspace functionality while making it composable and reusable for other entity types!

## Backend Data Transformation Challenge

The interface needs to handle complex backend data patterns including:
- Inconsistent naming conventions (camelCase vs snake_case)
- Complex JSON structures with nested relationships
- Different response formats per entity type
- Combined entity responses with metadata

### **Solution: Backend Adapter Plugin System**

```javascript
// Base backend adapter interface
class BackendAdapter {
  constructor(entityType, config) {
    this.entityType = entityType;
    this.config = config;
  }
  
  // Transform raw backend response to standard format
  transformResponse(rawData) {}
  
  // Transform standard format to backend request format
  transformRequest(standardData) {}
  
  // Extract items from paginated/grouped responses
  extractItems(response) {}
  
  // Transform single entity
  transformEntity(rawEntity) {}
}

// EntityWorkspace backend adapter (handles current complex patterns)
class EntityWorkspaceBackendAdapter extends BackendAdapter {
  transformResponse(rawData) {
    // Handle different response structures
    if (this._isGroupedResponse(rawData)) {
      return this._transformGroupedResponse(rawData);
    }
    
    if (this._isPaginatedResponse(rawData)) {
      return this._transformPaginatedResponse(rawData);
    }
    
    // Handle array responses
    if (Array.isArray(rawData)) {
      return {
        items: rawData.map(item => this.transformEntity(item)),
        total: rawData.length,
        page: 1,
        pageSize: rawData.length
      };
    }
    
    // Single entity response
    return {
      items: [this.transformEntity(rawData)],
      total: 1,
      page: 1, 
      pageSize: 1
    };
  }
  
  transformEntity(rawEntity) {
    if (!rawEntity) return null;
    
    const standardEntity = {
      // Normalize core fields
      id: rawEntity.id,
      entityType: this._detectEntityType(rawEntity),
      
      // Normalize display fields
      title: this._extractTitle(rawEntity),
      description: this._extractDescription(rawEntity),
      uid: this._extractUID(rawEntity),
      
      // Normalize status fields
      status: this._transformStatus(rawEntity.status),
      vurdering: this._transformVurdering(rawEntity.vurdering),
      prioritet: rawEntity.prioritet,
      obligatorisk: rawEntity.obligatorisk,
      
      // Normalize relationships
      parent: rawEntity.parent ? this.transformEntity(rawEntity.parent) : null,
      children: (rawEntity.children || []).map(child => this.transformEntity(child)),
      
      // Normalize emne/category
      emne: this._transformEmne(rawEntity.emne),
      emneId: rawEntity.emneId || rawEntity.emne?.id,
      
      // Handle complex relationship fields
      krav: this._transformRelationshipArray(rawEntity.krav, "krav"),
      tiltak: this._transformRelationshipArray(rawEntity.tiltak, "tiltak"),
      prosjektKrav: this._transformRelationshipArray(rawEntity.prosjektKrav, "prosjektKrav"),
      prosjektTiltak: this._transformRelationshipArray(rawEntity.prosjektTiltak, "prosjektTiltak"),
      
      // Preserve metadata for combined views
      _relatedToKrav: rawEntity._relatedToKrav,
      _displayedUnderKrav: rawEntity._displayedUnderKrav,
      _parentKrav: rawEntity._parentKrav,
      
      // Timestamps
      createdAt: rawEntity.createdAt,
      updatedAt: rawEntity.updatedAt,
      createdBy: rawEntity.createdBy,
      updatedBy: rawEntity.updatedBy,
      
      // Preserve all original data
      _raw: rawEntity
    };
    
    return this._applyEntityTypeSpecificTransforms(standardEntity, rawEntity);
  }
  
  transformRequest(standardData) {
    // Convert standard format back to backend format
    const backendData = {
      id: standardData.id,
      // Map back to backend field names
      tittel: standardData.title,
      beskrivelse: standardData.description,
      // ... other mappings based on entity type
    };
    
    // Apply entity-specific request transforms
    return this._applyRequestTransforms(backendData, standardData);
  }
  
  // Private helper methods
  _isGroupedResponse(rawData) {
    return rawData?.items && Array.isArray(rawData.items) && 
           rawData.items[0]?.emne && 
           (rawData.items[0]?.krav || rawData.items[0]?.tiltak || rawData.items[0]?.entities);
  }
  
  _isPaginatedResponse(rawData) {
    return rawData?.items && rawData?.total !== undefined;
  }
  
  _transformGroupedResponse(rawData) {
    const transformedGroups = rawData.items.map(group => ({
      emne: this._transformEmne(group.emne),
      entities: this._extractEntitiesFromGroup(group),
      // Preserve original structure for backward compatibility
      krav: group.krav?.map(item => this.transformEntity(item)) || [],
      tiltak: group.tiltak?.map(item => this.transformEntity(item)) || [],
      prosjektkrav: group.prosjektkrav?.map(item => this.transformEntity(item)) || [],
      prosjekttiltak: group.prosjekttiltak?.map(item => this.transformEntity(item)) || [],
    }));
    
    return {
      items: transformedGroups,
      total: rawData.total || transformedGroups.length,
      page: rawData.page || 1,
      pageSize: rawData.pageSize || transformedGroups.length,
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
  
  _extractEntitiesFromGroup(group) {
    const entities = [];
    
    // Extract from all possible entity arrays
    ['krav', 'tiltak', 'prosjektkrav', 'prosjekttiltak', 'entities'].forEach(key => {
      if (group[key]) {
        entities.push(...group[key].map(item => this.transformEntity(item)));
      }
    });
    
    return entities;
  }
  
  _detectEntityType(rawEntity) {
    // Use your existing detection logic
    if (rawEntity.entityType) return rawEntity.entityType;
    if (rawEntity.kravUID) return "krav";
    if (rawEntity.tiltakUID) return "tiltak";
    if (rawEntity.prosjektKravUID) return "prosjektKrav";
    if (rawEntity.prosjektTiltakUID) return "prosjektTiltak";
    return "unknown";
  }
  
  _extractTitle(rawEntity) {
    return rawEntity.tittel || rawEntity.navn || rawEntity.title || rawEntity.name || "";
  }
  
  _extractDescription(rawEntity) {
    // Handle TipTap JSON or plain text
    const desc = rawEntity.beskrivelse || rawEntity.description;
    if (!desc) return "";
    
    if (typeof desc === "object" && desc.type === "doc") {
      return this._extractTextFromTipTap(desc);
    }
    
    return desc;
  }
  
  _extractUID(rawEntity) {
    return rawEntity.kravUID || rawEntity.tiltakUID || 
           rawEntity.prosjektKravUID || rawEntity.prosjektTiltakUID ||
           rawEntity.uid || `${this._detectEntityType(rawEntity).toUpperCase()}${rawEntity.id}`;
  }
  
  _transformStatus(status) {
    if (!status) return null;
    return {
      id: status.id,
      name: status.navn || status.name,
      color: status.color,
      icon: status.icon
    };
  }
  
  _transformVurdering(vurdering) {
    if (!vurdering) return null;
    return {
      id: vurdering.id,
      name: vurdering.navn || vurdering.name,
      color: vurdering.color,
      icon: vurdering.icon
    };
  }
  
  _transformEmne(emne) {
    if (!emne) return null;
    return {
      id: emne.id,
      title: emne.tittel || emne.title,
      icon: emne.icon,
      color: emne.color,
      sortIt: emne.sortIt
    };
  }
  
  _transformRelationshipArray(items, entityType) {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      id: item.id,
      entityType: entityType,
      title: this._extractTitle(item),
      uid: this._extractUID(item),
      // Include minimal data for display
      ...item
    }));
  }
}

// Simple backend adapter for basic APIs
class SimpleBackendAdapter extends BackendAdapter {
  transformResponse(rawData) {
    // Handle simple REST API responses
    if (Array.isArray(rawData)) {
      return {
        items: rawData.map(item => this.transformEntity(item)),
        total: rawData.length,
        page: 1,
        pageSize: rawData.length
      };
    }
    
    return {
      items: [this.transformEntity(rawData)],
      total: 1,
      page: 1,
      pageSize: 1
    };
  }
  
  transformEntity(rawEntity) {
    // Simple transformation for standard REST APIs
    return {
      id: rawEntity.id,
      entityType: this.entityType,
      title: rawEntity.name || rawEntity.title,
      description: rawEntity.description,
      status: rawEntity.status,
      _raw: rawEntity
    };
  }
  
  transformRequest(standardData) {
    // Simple request transformation
    return {
      id: standardData.id,
      name: standardData.title,
      description: standardData.description,
      status: standardData.status
    };
  }
}
```

### **Integration with Plugin System**

```javascript
// Enhanced EntityInterface with backend adapter
class EntityInterface {
  constructor(entityType, config, plugins = {}) {
    this.type = EntityTypeTranslator.translate(entityType, "camelCase");
    this.config = EntityTypeResolver.resolveModelConfig(this.type);
    this.api = EntityTypeResolver.resolveApiConfig(this.type, this.config);
    
    // Backend adapter plugin
    this.backendAdapter = plugins.backendAdapter || 
      new EntityWorkspaceBackendAdapter(this.type, this.config);
    
    // Other plugins
    this.plugins = {
      store: plugins.store || new DefaultStorePlugin(),
      cache: plugins.cache || new DefaultCachePlugin(),
      filters: plugins.filters || new DefaultFiltersPlugin(),
      ...plugins.custom
    };
  }
  
  // Data fetching with automatic transformation
  async fetchData(params = {}) {
    const rawResponse = await this.api.queryFn(params);
    return this.backendAdapter.transformResponse(rawResponse);
  }
  
  // Entity saving with automatic transformation
  async saveEntity(standardEntity) {
    const backendData = this.backendAdapter.transformRequest(standardEntity);
    const rawResponse = await this.api.updateFn(standardEntity.id, backendData);
    return this.backendAdapter.transformEntity(rawResponse);
  }
}

// Factory with adapter presets
const EntityWorkspaceFactory = {
  // EntityWorkspace with complex backend handling
  full: (entityType, config, options = {}) => new EntityInterface(entityType, config, {
    backendAdapter: new EntityWorkspaceBackendAdapter(entityType, config),
    store: new EntityWorkspaceStorePlugin(),
    cache: new OptimisticUpdatesPlugin(options.queryClient, entityType),
    filters: new EntityFiltersPlugin(),
  }),
  
  // Simple interface for standard REST APIs
  simple: (entityType, config, options = {}) => new EntityInterface(entityType, config, {
    backendAdapter: new SimpleBackendAdapter(entityType, config),
    store: new SimpleStorePlugin(),
    cache: new SimpleCachePlugin(options.queryClient, entityType),
    filters: new SimpleFiltersPlugin(),
  }),
  
  // Custom adapter for specific backend patterns
  custom: (entityType, config, backendAdapter, otherPlugins) => new EntityInterface(entityType, config, {
    backendAdapter,
    ...otherPlugins
  })
};
```

### **Benefits of Backend Adapter Pattern:**

1. **Hides Backend Complexity**: Components only work with standardized data
2. **Flexible Backend Support**: Different adapters for different API patterns
3. **Preserves Raw Data**: `_raw` field keeps original data for edge cases
4. **Gradual Migration**: Can start with EntityWorkspace adapter, move to simpler ones
5. **Testable**: Each adapter can be tested independently with mock data
6. **Reusable**: EntityWorkspace adapter can handle other complex APIs

### **Usage Examples:**

```javascript
// Use complex EntityWorkspace backend patterns
const kravInterface = EntityWorkspaceFactory.full("krav", kravConfig, { queryClient });

// Use with simple REST API
const reportsInterface = EntityWorkspaceFactory.simple("reports", reportsConfig, { queryClient });

// Custom backend with specific transformation needs
const customAdapter = new CustomBackendAdapter("notifications", notificationConfig);
const notificationsInterface = EntityWorkspaceFactory.custom(
  "notifications", 
  notificationConfig, 
  customAdapter,
  { store: new SimpleStorePlugin() }
);
```

This approach isolates all the backend data complexity into dedicated adapters while keeping your interface components clean and reusable!