import { create } from 'zustand';

/**
 * Generic Zustand store for managing form field inheritance and mutual exclusivity
 * 
 * Supports multiple entity types with the same pattern:
 * - tiltak: parentId (tiltak) ↔ krav (multiselect) → emneId inheritance
 * - krav: parentId (krav) ↔ ??? → emneId inheritance  
 * - prosjektTiltak: parentId (prosjektTiltak) ↔ krav (multiselect) → emneId inheritance
 * 
 * The store is entity-agnostic and handles the mutual exclusivity pattern
 */
export const useFormInheritanceStore = create((set, get) => ({
  // State
  inheritedEmne: null,
  source: null, // 'parent' | 'krav' | 'prosjektKrav' | null
  sourceType: null, // 'tiltak' | 'krav' | 'prosjektTiltak' | null (for context)
  lastEntityId: null, // Track which entity this state belongs to
  
  // Parent connection (can be tiltak, krav, prosjektTiltak, etc.)
  parentData: null,
  parentType: null, // 'tiltak' | 'krav' | 'prosjektTiltak'
  
  // Related entity connection (krav, prosjektKrav, etc.)
  relatedEntityData: null,
  relatedEntityType: null, // 'krav' | 'prosjektKrav' | other
  
  // Mutual exclusivity state
  hasParentConnection: false,
  hasRelatedEntityConnection: false,
  
  // Actions - Generic inheritance setters
  setParentInheritance: (parentData, parentType = 'tiltak') => {
    const state = get();
    
    set({
      // Inheritance
      inheritedEmne: parentData?.emneId || null,
      source: parentData?.emneId ? 'parent' : null,
      sourceType: parentData?.emneId ? parentType : null,
      parentData,
      parentType: parentData ? parentType : null,
      
      // Mutual exclusivity - clear related entity when parent is set
      relatedEntityData: null,
      relatedEntityType: null,
      hasParentConnection: !!parentData?.emneId,
      hasRelatedEntityConnection: false
    });
  },
  
  setRelatedEntityInheritance: (entityData, entityType = 'krav') => {
    const state = get();
    
    set({
      // Inheritance  
      inheritedEmne: entityData?.emneId || null,
      source: entityData?.emneId ? entityType : null,
      sourceType: entityData?.emneId ? (state.sourceType || 'tiltak') : null, // Keep context
      relatedEntityData: entityData,
      relatedEntityType: entityData ? entityType : null,
      
      // Mutual exclusivity - clear parent when related entity is set
      parentData: null,
      parentType: null,
      hasRelatedEntityConnection: !!entityData?.emneId,
      hasParentConnection: false
    });
  },
  
  clearParentConnection: () => {
    const state = get();
    
    set({
      parentData: null,
      parentType: null,
      hasParentConnection: false,
      // Only clear inheritance if it was from parent
      ...(state.source === 'parent' && {
        inheritedEmne: null,
        source: null,
        sourceType: null
      })
    });
  },
  
  clearRelatedEntityConnection: () => {
    const state = get();
    
    set({
      relatedEntityData: null,
      relatedEntityType: null,
      hasRelatedEntityConnection: false,
      // Only clear inheritance if it was from related entity
      ...((state.source === 'krav' || state.source === 'prosjektKrav') && {
        inheritedEmne: null,
        source: null,
        sourceType: null
      })
    });
  },
  
  clearAllInheritance: () => {
    
    set({
      inheritedEmne: null,
      source: null,
      sourceType: null,
      parentData: null,
      parentType: null,
      relatedEntityData: null,
      relatedEntityType: null,
      hasParentConnection: false,
      hasRelatedEntityConnection: false
    });
  },
  
  // Context-aware actions for specific entity types
  initializeForEntityType: (entityType) => {
    set({
      sourceType: entityType
    });
  },

  // Context-aware initialization - only reset when switching between different entities
  initializeForEntity: (entityId, entityType) => {
    const state = get();
    const currentContext = `${entityType}-${entityId}`;
    const stateContext = `${state.sourceType}-${state.lastEntityId}`;
    
    // Only reset if we're switching to a completely different entity (not create-new, handled separately)
    if (entityId && currentContext !== stateContext && entityId !== "create-new") {
      
      set({
        inheritedEmne: null,
        source: null,
        sourceType: entityType,
        parentData: null,
        parentType: null,
        relatedEntityData: null,
        relatedEntityType: null,
        hasParentConnection: false,
        hasRelatedEntityConnection: false,
        lastEntityId: entityId
      });
    }
    
    if (entityId === "create-new") {
      // Always reset for new entity creation
      set({
        inheritedEmne: null,
        source: null,
        sourceType: entityType,
        parentData: null,
        parentType: null,
        relatedEntityData: null,
        relatedEntityType: null,
        hasParentConnection: false,
        hasRelatedEntityConnection: false,
        lastEntityId: entityId
      });
    }
  },
  
  // Legacy reset - kept for backward compatibility but made more conservative  
  resetForWorkspace: (entityType) => {
    const state = get();
    // Only reset if sourceType is fundamentally different or if no context exists
    if (!state.sourceType || (state.sourceType !== entityType && !state.lastEntityId)) {
      set({
        inheritedEmne: null,
        source: null,
        sourceType: entityType,
        parentData: null,
        parentType: null,
        relatedEntityData: null,
        relatedEntityType: null,
        hasParentConnection: false,
        hasRelatedEntityConnection: false
      });
    }
  },
  
  // Getters for convenience
  getState: () => get(),
  
  // Debug helpers (removed console.log for production)
  logState: () => {
    // Debug logging removed for production
  }
}));