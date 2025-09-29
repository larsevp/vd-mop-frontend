import { create } from 'zustand';

/**
 * Clean, simple inheritance stores for workspace isolation
 * Two separate stores for complete isolation between workspaces
 */

// Shared initial state structure
const createInitialState = () => ({
  inheritedEmne: null,
  source: null, // 'parent' | 'krav' | 'prosjektKrav' | null
  sourceType: null, // 'tiltak' | 'krav' | 'prosjektTiltak' | null
  lastEntityId: null,
  parentData: null,
  parentType: null,
  relatedEntityData: null,
  relatedEntityType: null,
  hasParentConnection: false,
  hasRelatedEntityConnection: false,
});

// KravTiltak workspace store
export const useKravTiltakInheritanceStore = create((set, get) => ({
  ...createInitialState(),

  setParentInheritance: (parentData, parentType = 'tiltak') => {
    set({
      inheritedEmne: parentData?.emneId || null,
      source: parentData ? 'parent' : null,
      sourceType: parentData ? parentType : null,
      parentData,
      parentType: parentData ? parentType : null,
      relatedEntityData: null,
      relatedEntityType: null,
      hasParentConnection: !!parentData,
      hasRelatedEntityConnection: false
    });
  },

  setRelatedEntityInheritance: (entityData, entityType = 'krav') => {
    const state = get();
    set({
      inheritedEmne: entityData?.emneId || null,
      source: entityData ? entityType : null,
      sourceType: entityData ? (state.sourceType || 'tiltak') : null,
      relatedEntityData: entityData,
      relatedEntityType: entityData ? entityType : null,
      parentData: null,
      parentType: null,
      hasRelatedEntityConnection: !!entityData,
      hasParentConnection: false
    });
  },

  clearParentConnection: () => {
    const state = get();
    set({
      parentData: null,
      parentType: null,
      hasParentConnection: false,
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
      ...((state.source === 'krav' || state.source === 'prosjektKrav') && {
        inheritedEmne: null,
        source: null,
        sourceType: null
      })
    });
  },

  clearAllInheritance: () => {
    set(createInitialState());
  },

  initializeForEntityType: (entityType) => {
    set({ sourceType: entityType });
  },

  initializeForEntity: (entityId, entityType) => {
    const state = get();
    const currentContext = `${entityType}-${entityId}`;
    const stateContext = `${state.sourceType}-${state.lastEntityId}`;

    if (entityId && currentContext !== stateContext && entityId !== "create-new") {
      set({
        ...createInitialState(),
        sourceType: entityType,
        lastEntityId: entityId
      });
    }

    if (entityId === "create-new") {
      set({
        ...createInitialState(),
        sourceType: entityType,
        lastEntityId: entityId
      });
    }
  },

  resetForWorkspace: (entityType) => {
    const state = get();
    if (!state.sourceType || (state.sourceType !== entityType && !state.lastEntityId)) {
      set({
        ...createInitialState(),
        sourceType: entityType
      });
    }
  }
}));

// ProsjektKravTiltak workspace store
export const useProsjektKravTiltakInheritanceStore = create((set, get) => ({
  ...createInitialState(),

  setParentInheritance: (parentData, parentType = 'prosjektTiltak') => {
    set({
      inheritedEmne: parentData?.emneId || null,
      source: parentData ? 'parent' : null,
      sourceType: parentData ? parentType : null,
      parentData,
      parentType: parentData ? parentType : null,
      relatedEntityData: null,
      relatedEntityType: null,
      hasParentConnection: !!parentData,
      hasRelatedEntityConnection: false
    });
  },

  setRelatedEntityInheritance: (entityData, entityType = 'prosjektKrav') => {
    const state = get();
    set({
      inheritedEmne: entityData?.emneId || null,
      source: entityData ? entityType : null,
      sourceType: entityData ? (state.sourceType || 'prosjektTiltak') : null,
      relatedEntityData: entityData,
      relatedEntityType: entityData ? entityType : null,
      parentData: null,
      parentType: null,
      hasRelatedEntityConnection: !!entityData,
      hasParentConnection: false
    });
  },

  clearParentConnection: () => {
    const state = get();
    set({
      parentData: null,
      parentType: null,
      hasParentConnection: false,
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
      ...((state.source === 'krav' || state.source === 'prosjektKrav') && {
        inheritedEmne: null,
        source: null,
        sourceType: null
      })
    });
  },

  clearAllInheritance: () => {
    set(createInitialState());
  },

  initializeForEntityType: (entityType) => {
    set({ sourceType: entityType });
  },

  initializeForEntity: (entityId, entityType) => {
    const state = get();
    const currentContext = `${entityType}-${entityId}`;
    const stateContext = `${state.sourceType}-${state.lastEntityId}`;

    if (entityId && currentContext !== stateContext && entityId !== "create-new") {
      set({
        ...createInitialState(),
        sourceType: entityType,
        lastEntityId: entityId
      });
    }

    if (entityId === "create-new") {
      set({
        ...createInitialState(),
        sourceType: entityType,
        lastEntityId: entityId
      });
    }
  },

  resetForWorkspace: (entityType) => {
    const state = get();
    if (!state.sourceType || (state.sourceType !== entityType && !state.lastEntityId)) {
      set({
        ...createInitialState(),
        sourceType: entityType
      });
    }
  }
}));