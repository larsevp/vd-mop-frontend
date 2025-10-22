/**
 * useEmneInheritance Hook
 *
 * Manages emne inheritance for Krav/Tiltak entities with proper React patterns.
 *
 * Inheritance Rules:
 * - Krav/ProsjektKrav: Inherit from parent only
 * - Tiltak: Inherit from parent OR connected Krav (mutual exclusivity)
 * - ProsjektTiltak: Inherit from parent OR connected ProsjektKrav (mutual exclusivity)
 *
 * Safety Patterns Implemented:
 * - Stable dependencies in useMemo (primitives only, no objects/arrays)
 * - useRef to prevent infinite loops
 * - Cleanup function in useEffect
 * - Proper TanStack Query configuration
 * - Error handling for all data fetching
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to manage emne inheritance logic
 *
 * @param {Object} formData - Current form state
 * @param {Object} dto - DTO instance with adapter
 * @param {string} entityType - Entity type (krav, tiltak, prosjektKrav, prosjektTiltak)
 * @param {Object} options - Optional configuration
 * @param {Object} options.kravConfig - ModelConfig for krav/prosjektKrav (needed for Tiltak entities)
 * @param {Object} options.modelConfig - ModelConfig for the current entity (for fetching parent)
 * @returns {Object} Inheritance state and computed values
 */
export function useEmneInheritance(formData, dto, entityType, options = {}) {
  const { kravConfig, modelConfig } = options;
  // Extract stable primitive values to avoid unnecessary rerenders
  const parentId = formData?.parentId || null;
  const kravIds = formData?.kravIds || [];
  const prosjektKravIds = formData?.prosjektKravIds || [];

  // Stabilize array dependencies by converting to comma-separated string
  const kravIdsKey = kravIds.join(',');
  const prosjektKravIdsKey = prosjektKravIds.join(',');

  // Determine which krav field to use based on entity type
  const isProsjektEntity = entityType?.toLowerCase().includes('prosjekt');
  const effectiveKravIds = isProsjektEntity ? prosjektKravIds : kravIds;
  const firstKravId = effectiveKravIds?.[0] || null;

  // === FETCH PARENT DATA ===
  // Only fetch if parentId exists
  const {
    data: parentData,
    isLoading: isLoadingParent,
    error: parentError,
  } = useQuery({
    queryKey: ['parent', entityType, parentId],
    queryFn: async () => {
      if (!parentId) return null;

      console.log('LOGBACKEND useEmneInheritance - Fetching parent:', {
        entityType,
        parentId,
        hasModelConfig: !!modelConfig,
        hasDtoAdapterConfig: !!dto?.adapter?.config
      });

      // Use modelConfig if provided, otherwise fall back to dto.adapter.config
      const config = modelConfig || dto?.adapter?.config;
      if (!config) {
        console.warn('LOGBACKEND useEmneInheritance - No config available');
        return null;
      }

      // Use getByIdFn for fetching single entity (NOT queryFn which is for paginated queries)
      const getByIdFn = config.getByIdFn;
      if (!getByIdFn) {
        console.warn(`LOGBACKEND useEmneInheritance - No getByIdFn available for entity type: ${entityType}`, config);
        return null;
      }

      // Fetch single entity by ID
      const result = await getByIdFn(parentId);
      const data = result?.data || result;

      console.log('LOGBACKEND useEmneInheritance - Parent fetched:', {
        parentId,
        hasData: !!data,
        parentTitle: data?.tittel || data?.title,
        parentUID: data?.kravUID || data?.tiltakUID,
        emneId: data?.emneId,
        emne: data?.emne,
        fullParentData: data
      });

      return data;
    },
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5,      // Cache for 5 minutes
    refetchOnWindowFocus: true,     // Refetch when window regains focus
    refetchOnMount: true,           // Refetch on component mount
    retry: 1,                       // Retry failed requests once
  });

  // === FETCH KRAV DATA ===
  // Only fetch if we have kravIds and entity is Tiltak/ProsjektTiltak
  const shouldFetchKrav = (
    entityType?.toLowerCase().includes('tiltak') &&
    firstKravId !== null
  );

  const {
    data: kravData,
    isLoading: isLoadingKrav,
    error: kravError,
  } = useQuery({
    queryKey: ['krav', isProsjektEntity ? 'prosjektkrav' : 'krav', firstKravId],
    queryFn: async () => {
      if (!firstKravId || !kravConfig) return null;

      // Use getByIdFn for fetching single krav entity
      const getByIdFn = kravConfig.getByIdFn;
      if (!getByIdFn) {
        console.warn('LOGBACKEND useEmneInheritance - No getByIdFn available for krav config');
        return null;
      }

      // Fetch single krav entity by ID
      const result = await getByIdFn(firstKravId);
      return result?.data || result;
    },
    enabled: shouldFetchKrav && !!kravConfig,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  });

  // === COMPUTE INHERITANCE ===
  // Use adapter's business logic to determine effective emneId
  // Dependencies: Only stable primitives (no objects/arrays)
  const inheritanceInfo = useMemo(() => {
    // Safety check: ensure adapter exists
    if (!dto?.adapter?.getEffectiveEmneId) {
      return {
        emneId: formData?.emneId || null,
        source: null,
        sourceData: null,
        isInherited: false,
        hasParentConnection: false,
        hasKravConnection: false,
        emneDisabled: false,
        parentDisabled: false,
        kravDisabled: false,
      };
    }

    // Call adapter method with current data
    // Adapter returns complete inheritance information
    const result = dto.adapter.getEffectiveEmneId(
      formData,
      parentData,
      kravData
    );

    // Debug logging
    if (formData?.parentId) {
      console.log('LOGBACKEND useEmneInheritance - Inheritance computed:', {
        entityType,
        parentId: formData.parentId,
        hasParentData: !!parentData,
        parentEmneId: parentData?.emneId,
        inheritedEmneId: result.emneId,
        source: result.source,
        isInherited: result.isInherited
      });
    }

    return result;
  }, [
    // Stable primitive dependencies only
    formData?.parentId,
    formData?.emneId,
    isProsjektEntity ? prosjektKravIdsKey : kravIdsKey,
    parentData?.emneId,
    kravData?.emneId,
    dto?.adapter?.getEffectiveEmneId,  // Function reference is stable
    entityType
  ]);

  // === COMPUTE LOADING STATE ===
  const isLoading = useMemo(() => {
    // Only consider loading if we're actually waiting for required data
    const waitingForParent = !!parentId && isLoadingParent;
    const waitingForKrav = shouldFetchKrav && isLoadingKrav;
    return waitingForParent || waitingForKrav;
  }, [parentId, isLoadingParent, shouldFetchKrav, isLoadingKrav]);

  // === ERROR HANDLING ===
  const error = parentError || kravError;
  if (error) {
    console.error('useEmneInheritance: Error fetching inheritance data', error);
  }

  // === RETURN COMPUTED STATE ===
  return {
    // Inheritance information from adapter
    inheritedEmneId: inheritanceInfo.emneId,
    source: inheritanceInfo.source,
    sourceData: inheritanceInfo.sourceData,
    isInherited: inheritanceInfo.isInherited,

    // Mutual exclusivity flags
    hasParentConnection: inheritanceInfo.hasParentConnection,
    hasKravConnection: inheritanceInfo.hasKravConnection,

    // Field disabled states
    emneDisabled: inheritanceInfo.emneDisabled,
    parentDisabled: inheritanceInfo.parentDisabled,
    kravDisabled: inheritanceInfo.kravDisabled,

    // Loading and error states
    isLoading,
    error,

    // Raw data for advanced use cases
    parentData,
    kravData,
  };
}

export default useEmneInheritance;
