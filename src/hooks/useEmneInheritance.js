import React, { useCallback } from 'react';
import Swal from 'sweetalert2';
import { useFormInheritanceStore } from '../stores/formInheritanceStore';

/**
 * Custom hook for managing emne inheritance and mutual exclusivity
 * Generic hook that works with multiple entity types (tiltak, krav, prosjektTiltak)
 * Provides clean API for components to handle form inheritance logic
 */
export const useEmneInheritance = (entityType = 'tiltak', entityId = null) => {
  const {
    inheritedEmne,
    source,
    sourceType,
    parentData,
    parentType,
    relatedEntityData,
    relatedEntityType,
    hasParentConnection,
    hasRelatedEntityConnection,
    setParentInheritance,
    setRelatedEntityInheritance,
    clearParentConnection,
    clearRelatedEntityConnection,
    clearAllInheritance,
    initializeForEntityType,
    initializeForEntity,
    resetForWorkspace,
    logState
  } = useFormInheritanceStore();

  // Initialize store for this entity type on first use
  React.useEffect(() => {
    initializeForEntityType(entityType);
  }, [entityType, initializeForEntityType]);

  // Track current entity ID to prevent state leakage between entities
  const [currentEntityId, setCurrentEntityId] = React.useState(null);
  
  // Stable reference to clear function to prevent infinite loops
  const stableClear = React.useCallback(() => {
    clearAllInheritance();
  }, []); // Empty deps - this function is always the same

  // Clear inheritance state when switching between different entities
  React.useEffect(() => {
    // Only clear if we're switching to a different entity (not just re-mounting same entity)
    if (entityId && entityId !== currentEntityId) {
      // Always clear inheritance state when switching to create new entity
      if (entityId === 'create-new' || entityId.toString().includes('create')) {
        stableClear();
      }
      // DISABLED: Don't clear if inheritance is actively being used (parent/related entity connections)
      // This was causing infinite loops when parent/krav with no emne was selected
      // else if (!hasParentConnection && !hasRelatedEntityConnection && inheritedEmne) {
      //   console.log('🔧 Clearing residual inheritance');
      //   stableClear();
      // }
      setCurrentEntityId(entityId);
    }
  }, [entityId, currentEntityId, hasParentConnection, hasRelatedEntityConnection, inheritedEmne, stableClear]);

  // Handle parent inheritance (generic - works for tiltak, krav, prosjektTiltak parents)
  const inheritFromParent = useCallback((parentData, parentEntityType = entityType) => {
    if (parentData) {
      // Always set parent inheritance when parent exists (regardless of whether parent has emne)
      setParentInheritance(parentData, parentEntityType);
      
      // Show notification only if parent actually has an emne to inherit
      if (parentData?.emneId) {
        Swal.fire({
          icon: "info",
          title: "Emne arves automatisk",
          text: "Emne arves fra overordnet element",
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
          showClass: { popup: "", backdrop: "", icon: "" },
          hideClass: { popup: "", backdrop: "", icon: "" },
          width: '350px',
          padding: '0.75rem',
          customClass: {
            popup: 'swal2-toast-small',
            title: 'swal2-toast-title-small',
            htmlContainer: 'swal2-toast-text-small'
          }
        });
      }
    } else {
      // Clear parent connection if no parent
      clearParentConnection();
    }
  }, [setParentInheritance, clearParentConnection, entityType]);

  // Handle related entity inheritance (krav, prosjektKrav, etc.)
  const inheritFromRelatedEntity = useCallback((entityData, relatedType = 'krav') => {
    if (entityData) {
      // Always set related entity inheritance when entity exists (regardless of whether entity has emne)
      setRelatedEntityInheritance(entityData, relatedType);
      
      // Show notification only if entity actually has an emne to inherit
      if (entityData?.emneId) {
        const entityLabel = relatedType === 'prosjektKrav' ? 'prosjektkrav' : relatedType;
        Swal.fire({
          icon: "info",
          title: "Emne arves automatisk", 
          text: `Emne arves fra tilknyttet ${entityLabel}`,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
          showClass: { popup: "", backdrop: "", icon: "" },
          hideClass: { popup: "", backdrop: "", icon: "" },
          width: '350px',
          padding: '0.75rem',
          customClass: {
            popup: 'swal2-toast-small',
            title: 'swal2-toast-title-small',
            htmlContainer: 'swal2-toast-text-small'
          }
        });
      }
    } else {
      // Clear related entity connection if no entity
      clearRelatedEntityConnection();
    }
  }, [setRelatedEntityInheritance, clearRelatedEntityConnection, entityType]);

  // Handle parent selection (generic for any parent type)
  const handleParentSelection = useCallback((parentId, parentData, parentEntityType = entityType) => {
    if (parentId && parentData) {
      inheritFromParent(parentData, parentEntityType);
    } else {
      clearParentConnection();
    }
  }, [inheritFromParent, clearParentConnection, entityType]);

  // Handle related entity selection (generic for krav, prosjektKrav, etc.)
  const handleRelatedEntitySelection = useCallback((selectedEntityIds, apiData, relatedType = 'krav') => {
    
    if (selectedEntityIds?.length > 0 && apiData?.length > 0) {
      // Find first selected entity in API data
      const firstSelectedEntityId = selectedEntityIds[0];
      const selectedEntity = apiData.find(entity => entity.id == firstSelectedEntityId);
      
      if (selectedEntity) {
        inheritFromRelatedEntity(selectedEntity, relatedType);
      } else {
        clearRelatedEntityConnection();
      }
    } else {
      clearRelatedEntityConnection();
    }
  }, [inheritFromRelatedEntity, clearRelatedEntityConnection]);

  // Utility functions
  const isFieldDisabled = useCallback((fieldType) => {
    
    switch (fieldType) {
      case 'parent':
        return hasRelatedEntityConnection; // Parent disabled when krav/prosjektKrav selected
      case 'krav':
      case 'prosjektKrav':
      case 'relatedEntity':
        return hasParentConnection; // Krav disabled when parent selected
      case 'emne':
        return hasParentConnection || hasRelatedEntityConnection; // Emne disabled when parent OR krav connection exists
      default:
        return false;
    }
  }, [hasRelatedEntityConnection, hasParentConnection, inheritedEmne]);

  const getDisabledPlaceholder = useCallback((fieldType) => {
    const getEntityLabel = (type) => {
      switch (type) {
        case 'prosjektKrav': return 'prosjektkrav';
        case 'krav': return 'krav';
        default: return type;
      }
    };

    switch (fieldType) {
      case 'parent':
        return hasRelatedEntityConnection ? `Deaktivert - fjern ${getEntityLabel(relatedEntityType)}-tilknytning først` : undefined;
      case 'krav':
      case 'prosjektKrav':
      case 'relatedEntity':
        return hasParentConnection ? "Deaktivert - fjern overordnet element først" : undefined;
      case 'emne':
        if (inheritedEmne) {
          const sourceLabel = source === 'parent' ? 'overordnet element' : `tilknyttet ${getEntityLabel(source)}`;
          return `Arves fra ${sourceLabel}`;
        }
        return undefined;
      default:
        return undefined;
    }
  }, [hasRelatedEntityConnection, hasParentConnection, inheritedEmne, source, relatedEntityType]);

  // Legacy aliases for backward compatibility
  const handleKravSelection = useCallback((selectedIds, apiData) => 
    handleRelatedEntitySelection(selectedIds, apiData, 'krav'), 
    [handleRelatedEntitySelection]
  );

  const handleProsjektKravSelection = useCallback((selectedIds, apiData) => 
    handleRelatedEntitySelection(selectedIds, apiData, 'prosjektKrav'), 
    [handleRelatedEntitySelection]
  );


  return {
    // State
    inheritedEmne,
    source,
    sourceType,
    parentData,
    parentType,
    relatedEntityData,
    relatedEntityType,
    hasParentConnection,
    hasRelatedEntityConnection,
    hasInheritance: !!inheritedEmne,

    // Generic actions
    inheritFromParent,
    inheritFromRelatedEntity,
    handleParentSelection,
    handleRelatedEntitySelection,
    clearParentConnection,
    clearRelatedEntityConnection,
    clearAllInheritance,

    // Workspace management
    initializeForEntity,
    resetForWorkspace,

    // Legacy/convenience actions
    handleKravSelection,
    handleProsjektKravSelection,

    // Utilities
    isFieldDisabled,
    getDisabledPlaceholder,
    
    // Debug
    logState
  };
};