/**
 * EntityWorkspace Zustand Store - Centralized state management
 * Integrates real backend data fetching with optimistic updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EntityTypeResolver } from '@/components/EntityWorkspace/services/EntityTypeResolver';
import { EntityFilterService } from '@/components/EntityWorkspace/services/EntityFilterService';
import { handleOptimisticEntityUpdate, sortItemsByEmne } from '@/components/EntityWorkspace/utils/optimisticUpdates';

const useEntityWorkspaceStore = create(
  devtools(
    (set, get) => ({
      // Current workspace configuration
      currentEntityType: null,
      modelConfig: null,
      workspaceConfig: {},
      
      // Data state
      selectedEntity: null,
      
      // UI state - mirrors useEntityState
      searchInput: '',
      searchQuery: '',
      filterBy: 'all',
      sortBy: 'id',
      sortOrder: 'asc',
      viewMode: 'split',
      groupByEmne: true,
      showMerknader: false,
      
      // Pagination
      page: 1,
      pageSize: 50,
      
      // Advanced filters
      additionalFilters: {},
      
      // Toast notifications
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      
      // Expanded state
      expandedCards: new Set(),
      collapsedGroups: new Set(),
      activeEntity: null,
      
      // Error state
      error: null,

      // Actions
      initializeWorkspace: (entityType, modelConfig, workspaceConfig = {}) => {
        // Debug project entities
        const isProjectEntity = entityType.includes('prosjekt') || entityType.includes('project');
        if (isProjectEntity) {
          console.log('🏗️ Initializing PROJECT entity workspace:', {
            entityType,
            modelConfig: modelConfig?.title,
            workspaceConfig: workspaceConfig?.layout,
            supportsGroupByEmne: EntityTypeResolver._supportsGroupByEmne(entityType)
          });
        }
        
        set({ 
          currentEntityType: entityType,
          modelConfig: modelConfig,
          workspaceConfig: workspaceConfig,
          viewMode: workspaceConfig.layout || 'split',
          groupByEmne: EntityTypeResolver._supportsGroupByEmne(entityType),
          error: null,
          // Reset filters when switching entity types
          filterBy: 'all',
          additionalFilters: {},
          searchInput: '',
          searchQuery: '',
          page: 1
        });
      },

      clearError: () => set({ error: null }),
      
      reset: () => {
        set({
          currentEntityType: null,
          modelConfig: null,
          workspaceConfig: {},
          selectedEntity: null,
          searchInput: '',
          searchQuery: '',
          filterBy: 'all',
          additionalFilters: {},
          page: 1,
          error: null
        });
      },

      // UI State Actions (from useEntityState)
      setSearchInput: (searchInput) => set({ searchInput }),
      
      handleSearchInputChange: (value) => set({ searchInput: value }),
      
      handleSearch: () => {
        const { searchInput } = get();
        set({ searchQuery: searchInput, page: 1 });
      },
      
      handleClearSearch: () => {
        set({ 
          searchInput: '', 
          searchQuery: '', 
          page: 1 
        });
      },

      handleFilterChange: (filterBy) => {
        set({ filterBy, page: 1 });
      },

      handleSortChange: (sortBy) => {
        set({ sortBy, page: 1 });
      },

      handleSortOrderChange: (sortOrder) => {
        set({ sortOrder, page: 1 });
      },

      handleAdditionalFiltersChange: (additionalFilters) => {
        set({ additionalFilters, page: 1 });
      },

      setViewMode: (viewMode) => set({ viewMode }),
      setGroupByEmne: (groupByEmne) => set({ groupByEmne }),
      setShowMerknader: (showMerknader) => set({ showMerknader }),
      setPage: (page) => set({ page }),
      setActiveEntity: (activeEntity) => set({ activeEntity }),
      setSelectedEntity: (selectedEntity) => set({ selectedEntity }),

      // Toast actions
      showToast: (message, type = 'success') => {
        set({
          toast: {
            show: true,
            message,
            type
          }
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          set({
            toast: {
              show: false,
              message: '',
              type: 'success'
            }
          });
        }, 5000);
      },

      hideToast: () => {
        set({
          toast: {
            show: false,
            message: '',
            type: 'success'
          }
        });
      },

      // Expanded state actions
      setExpandedCards: (expandedCards) => set({ expandedCards }),
      
      toggleGroupCollapse: (groupKey) => {
        const { collapsedGroups } = get();
        const newCollapsedGroups = new Set(collapsedGroups);
        
        if (newCollapsedGroups.has(groupKey)) {
          newCollapsedGroups.delete(groupKey);
        } else {
          newCollapsedGroups.add(groupKey);
        }
        
        set({ collapsedGroups: newCollapsedGroups });
      },

      // Create new entity handler (from useEntityState)
      handleCreateNew: (user) => {
        const { currentEntityType, modelConfig } = get();
        
        if (!currentEntityType || !modelConfig) return;

        // Create new entity template
        const newEntity = {
          id: 'create-new',
          isNew: true,
          // Add default fields based on entity type
          ...(currentEntityType === 'krav' || currentEntityType === 'prosjektKrav' 
            ? { tittel: '', beskrivelse: '', obligatorisk: false }
            : { navn: '', beskrivelse: '' }
          ),
          // Add user context
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
        };

        set({ 
          selectedEntity: newEntity,
          activeEntity: newEntity.id 
        });
      },

      // Entity action handlers (integrated from useEntityActions)
      handleSave: async (entityData, { queryClient, onSuccess, onError }) => {
        const { currentEntityType, modelConfig } = get();
        
        console.log('🔧 Zustand handleSave called:', {
          currentEntityType,
          entityDataId: entityData?.id,
          entityDataKeys: Object.keys(entityData || {}),
          entityData: entityData
        });
        
        try {
          const apiConfig = EntityTypeResolver.resolveApiConfig(currentEntityType, modelConfig);
          const isNewEntity = entityData.id === 'create-new' || entityData.isNew;
          
          console.log('🔧 Save operation details:', {
            isNewEntity,
            apiConfigUpdateFn: typeof apiConfig.updateFn,
            apiConfigCreateFn: typeof apiConfig.createFn
          });
          
          let result;
          if (isNewEntity) {
            // Create new entity
            const { id, isNew, ...createData } = entityData;
            result = await apiConfig.createFn(createData);
          } else {
            // Update existing entity
            result = await apiConfig.updateFn(entityData.id, entityData);
          }

          // Handle optimistic updates if needed
          if (!isNewEntity && result) {
            const queryKey = [currentEntityType, "workspace", "paginated"];
            handleOptimisticEntityUpdate({
              queryClient,
              queryKey,
              updatedData: result.data || result,
              originalData: entityData,
              entityType: currentEntityType
            });
          }

          // Invalidate relevant caches
          queryClient.invalidateQueries({
            queryKey: [currentEntityType, "workspace"],
            exact: false,
          });

          // For krav/tiltak, also invalidate combined entities
          if (['tiltak', 'krav', 'prosjektKrav', 'prosjektTiltak'].includes(currentEntityType)) {
            queryClient.invalidateQueries({
              queryKey: ["combinedEntities", "workspace"],
              exact: false,
            });
          }

          const entityDisplayName = modelConfig.title || currentEntityType;
          const message = isNewEntity 
            ? `${entityDisplayName} opprettet` 
            : `${entityDisplayName} oppdatert`;
            
          get().showToast(message, 'success');
          onSuccess?.(message, 'success');
          
          return result;
        } catch (error) {
          console.error(`Error saving ${currentEntityType}:`, error);
          const message = `Feil ved lagring av ${modelConfig.title || currentEntityType}`;
          get().showToast(message, 'error');
          onError?.(message, 'error');
          throw error;
        }
      },

      // Filtering methods (integrated from useEntityFiltering)
      applyFilters: (items) => {
        const { currentEntityType, filterBy, additionalFilters, groupByEmne } = get();
        
        if (!items || items.length === 0) return items;
        
        const combinedFilters = {
          filterBy,
          ...additionalFilters
        };
        
        return EntityFilterService.applyFilters(
          items, 
          combinedFilters, 
          currentEntityType, 
          groupByEmne
        );
      },
      
      getFilteringInfo: (items) => {
        const { currentEntityType, filterBy, additionalFilters, groupByEmne } = get();
        
        // Debug project entities specifically
        const isProjectEntity = currentEntityType?.includes('prosjekt') || currentEntityType?.includes('project');
        if (isProjectEntity) {
          console.log('🔍 PROJECT entity filtering:', {
            currentEntityType,
            itemsLength: items?.length,
            itemsType: Array.isArray(items) ? 'array' : typeof items,
            groupByEmne,
            firstItem: items?.[0],
            firstItemKeys: items?.[0] ? Object.keys(items[0]) : [],
            allItems: items // Log all items to see the structure
          });
        }
        
        if (!items || items.length === 0) {
          if (isProjectEntity) {
            console.log('⚠️ PROJECT entity has NO DATA - returning empty result');
          }
          return {
            filteredItems: items || [],
            filteredStats: { total: 0, obligatorisk: 0, optional: 0 },
            availableStatuses: [],
            availableVurderinger: [],
            availableEmner: [],
            availablePriorities: [],
            hasActiveFilters: false,
            activeFilterCount: 0
          };
        }

        const combinedFilters = {
          filterBy,
          ...additionalFilters
        };

        // Apply filters
        let filteredItems = EntityFilterService.applyFilters(
          items, 
          combinedFilters, 
          currentEntityType, 
          groupByEmne
        );

        // Debug project entity filtering results
        if (isProjectEntity) {
          console.log('🔍 PROJECT entity AFTER filtering:', {
            originalCount: items?.length,
            filteredCount: filteredItems?.length,
            combinedFilters,
            filteredItems: filteredItems
          });
        }

        // Note: Backend should handle sorting via sortBy parameter in useEntityData
        // Only apply client-side sorting for specific cases where backend sorting is insufficient
        // Most sorting issues are caused by interfering with backend sorting, so we rely on that primarily

        // Calculate stats
        const filteredStats = EntityFilterService.calculateStats(
          filteredItems, 
          currentEntityType, 
          groupByEmne
        );

        // Extract available filter options
        const availableFilters = EntityFilterService.extractAvailableFilters(items, currentEntityType);

        // Check if filters are active
        const hasActiveFilters = Object.keys(combinedFilters).some(key => {
          const value = combinedFilters[key];
          return value && value !== 'all' && value !== '';
        });

        const activeFilterCount = Object.entries(combinedFilters).filter(([key, value]) => {
          return value && value !== 'all' && value !== '';
        }).length;

        const result = {
          filteredItems,
          filteredStats,
          availableStatuses: availableFilters.statuses,
          availableVurderinger: availableFilters.vurderinger,
          availableEmner: availableFilters.emner,
          availablePriorities: availableFilters.priorities,
          hasActiveFilters,
          activeFilterCount,
          combinedFilters
        };

        // Debug project entity final result
        if (isProjectEntity) {
          console.log('🔍 PROJECT entity FINAL RESULT:', {
            filteredItemsCount: result.filteredItems?.length,
            filteredStats: result.filteredStats,
            hasActiveFilters: result.hasActiveFilters,
            result
          });
        }

        return result;
      },

      handleDelete: async (entity, { queryClient, onSuccess, onError }) => {
        const { currentEntityType, modelConfig } = get();
        
        try {
          const apiConfig = EntityTypeResolver.resolveApiConfig(currentEntityType, modelConfig);
          await apiConfig.deleteFn(entity.id);

          // Invalidate caches
          queryClient.invalidateQueries({
            queryKey: [currentEntityType, "workspace"],
            exact: false,
          });

          if (['tiltak', 'krav', 'prosjektKrav', 'prosjektTiltak'].includes(currentEntityType)) {
            queryClient.invalidateQueries({
              queryKey: ["combinedEntities", "workspace"],
              exact: false,
            });
          }

          // Clear selected entity if it was deleted
          const { selectedEntity } = get();
          if (selectedEntity?.id === entity.id) {
            set({ selectedEntity: null, activeEntity: null });
          }

          const message = `${modelConfig.title || currentEntityType} slettet`;
          get().showToast(message, 'success');
          onSuccess?.(message, 'success');
        } catch (error) {
          console.error(`Error deleting ${currentEntityType}:`, error);
          const message = `Feil ved sletting av ${modelConfig.title || currentEntityType}`;
          get().showToast(message, 'error');
          onError?.(message, 'error');
          throw error;
        }
      }
    }),
    {
      name: 'entity-workspace-store',
    }
  )
);

export default useEntityWorkspaceStore;