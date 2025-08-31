/**
 * EntityWorkspace Zustand Store - Centralized state for krav, tiltak, prosjektKrav, prosjektTiltak
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ConfigProcessor } from '@/components/EntityWorkspace/services/ConfigProcessor';
import { EntityFilterService } from '@/components/EntityWorkspace/services/EntityFilterService';
import { regroupByEmne } from '@/components/EntityWorkspace/utils/optimisticUpdates';

const useEntityWorkspaceStore = create(
  devtools(
    (set, get) => ({
      // Current entity configuration
      currentEntityType: null,
      processedConfig: null,
      workspaceConfig: {},
      
      // Data state
      entities: [],
      selectedEntity: null,
      filteredEntities: [],
      groupedEntities: new Map(),
      groupByEmne: false,
      
      // UI state
      isLoading: false,
      isEditing: false,
      viewMode: 'split', // 'split', 'grid', 'table'
      
      // Search and filters
      searchTerm: '',
      activeFilters: {},
      sortConfig: { field: 'id', direction: 'desc' },
      
      // Error state
      error: null,

      // Actions
      initializeWorkspace: (entityType, modelConfig, workspaceConfig) => {
        try {
          const config = ConfigProcessor.processConfig(entityType);
          set({ 
            currentEntityType: entityType,
            processedConfig: config,
            workspaceConfig: workspaceConfig,
            viewMode: config.workspace?.layout || 'split',
            groupByEmne: entityType === 'krav' || entityType === 'prosjektKrav',
            error: null 
          });
          
          // Load sample data for demonstration
          get().loadSampleData(entityType);
        } catch (error) {
          set({ error: error.message });
        }
      },

      // Load sample data for development/testing
      loadSampleData: (entityType) => {
        set({ isLoading: true });
        
        // Simulate API delay
        setTimeout(() => {
          const sampleData = get().generateSampleData(entityType);
          set({ 
            entities: sampleData,
            isLoading: false 
          });
          get().applyFiltersAndGrouping();
        }, 500);
      },

      // Generate sample data based on entity type
      generateSampleData: (entityType) => {
        if (entityType === 'krav' || entityType === 'prosjektKrav') {
          return [
            {
              id: 1,
              kravUID: 'K001',
              tittel: 'Støykrav for utendørsområder',
              beskrivelse: 'Grenseverdier for støy i utendørsområder må ikke overskrides',
              obligatorisk: true,
              status: { navn: 'Aktiv', id: 1 },
              vurdering: { navn: 'Høy', id: 1 },
              emne: { id: 1, tittel: 'Støy', icon: 'volume-2', color: '#ff6b35' },
              prioritet: 1,
              updatedAt: '2024-01-15T10:30:00Z'
            },
            {
              id: 2,
              kravUID: 'K002', 
              tittel: 'Luftkvalitetskrav',
              beskrivelse: 'Luftkvaliteten skal oppfylle nasjonale standarder',
              obligatorisk: true,
              status: { navn: 'Under vurdering', id: 2 },
              vurdering: { navn: 'Medium', id: 2 },
              emne: { id: 2, tittel: 'Luft', icon: 'wind', color: '#4ecdc4' },
              prioritet: 2,
              updatedAt: '2024-01-14T15:45:00Z'
            },
            {
              id: 3,
              kravUID: 'K003',
              tittel: 'Vannkvalitetskontroll',
              beskrivelse: 'Regelmessig kontroll av vannkvalitet',
              obligatorisk: false,
              status: { navn: 'Inaktiv', id: 3 },
              vurdering: { navn: 'Lav', id: 3 },
              emne: { id: 3, tittel: 'Vann', icon: 'droplets', color: '#45b7d1' },
              prioritet: 3,
              updatedAt: '2024-01-13T09:20:00Z'
            }
          ];
        } else if (entityType === 'tiltak' || entityType === 'prosjektTiltak') {
          return [
            {
              id: 1,
              tiltakUID: 'T001',
              navn: 'Støyskjerm langs E6',
              beskrivelse: 'Installering av støyskjerm for å redusere trafikktøy',
              status: { navn: 'Planlagt', id: 1 },
              vurdering: { navn: 'Høy', id: 1 },
              prioritet: 1,
              updatedAt: '2024-01-15T14:20:00Z'
            },
            {
              id: 2,
              tiltakUID: 'T002',
              navn: 'Luftkvalitetsmåling',
              beskrivelse: 'Etablering av målestasjoner for luftkvalitet',
              status: { navn: 'Under utførelse', id: 2 },
              vurdering: { navn: 'Medium', id: 2 },
              prioritet: 2,
              updatedAt: '2024-01-14T11:30:00Z'
            }
          ];
        }
        return [];
      },

      setEntityType: (entityType) => {
        try {
          const config = ConfigProcessor.processConfig(entityType);
          set({ 
            currentEntityType: entityType,
            processedConfig: config,
            viewMode: config.workspace?.layout || 'split',
            groupByEmne: entityType === 'krav' || entityType === 'prosjektKrav',
            error: null 
          });
        } catch (error) {
          set({ error: error.message });
        }
      },

      setEntities: (entities) => {
        set({ entities });
        get().applyFiltersAndGrouping();
      },

      setSelectedEntity: (entity) => set({ selectedEntity: entity }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setIsEditing: (isEditing) => set({ isEditing }),

      setViewMode: (viewMode) => set({ viewMode }),

      setSearchTerm: (searchTerm) => {
        set({ searchTerm });
        get().applyFiltersAndGrouping();
      },

      setActiveFilters: (activeFilters) => {
        set({ activeFilters });
        get().applyFiltersAndGrouping();
      },

      setSortConfig: (sortConfig) => {
        set({ sortConfig });
        get().applySorting();
      },

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Apply filters, search, and grouping
      applyFiltersAndGrouping: () => {
        const { entities, searchTerm, activeFilters, currentEntityType, groupByEmne, sortConfig } = get();
        
        // Use EntityFilterService for consistent filtering
        let filtered = EntityFilterService.applyFilters(entities, {
          ...activeFilters,
          searchTerm
        }, currentEntityType, groupByEmne);

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
          const aVal = a[sortConfig.field];
          const bVal = b[sortConfig.field];
          
          if (aVal === bVal) return 0;
          
          const comparison = aVal < bVal ? -1 : 1;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        // Handle grouping for krav/prosjektKrav
        if (groupByEmne && currentEntityType && (currentEntityType === 'krav' || currentEntityType === 'prosjektKrav')) {
          const grouped = regroupByEmne(sorted, currentEntityType);
          const groupedMap = new Map();
          
          grouped.forEach(group => {
            const emneId = group.emne?.id || 'no-emne';
            groupedMap.set(emneId, group[currentEntityType] || []);
          });

          set({ 
            filteredEntities: sorted,
            groupedEntities: groupedMap 
          });
        } else {
          set({ 
            filteredEntities: sorted,
            groupedEntities: new Map() 
          });
        }
      },

      // Legacy method for compatibility
      applyFilters: () => get().applyFiltersAndGrouping(),
      applySorting: () => get().applyFiltersAndGrouping(),

      // Reset all filters
      resetFilters: () => {
        set({ 
          searchTerm: '',
          activeFilters: {}
        });
        get().applyFiltersAndGrouping();
      },

      // Create new entity
      createEntity: async (entityData) => {
        const { processedConfig } = get();
        if (!processedConfig) return;

        set({ isLoading: true, error: null });
        
        try {
          const apiFunctions = ConfigProcessor.getAPIFunctions(processedConfig);
          const newEntity = await apiFunctions.createFn(entityData);
          
          const { entities } = get();
          set({ entities: [...entities, newEntity] });
          get().applyFiltersAndGrouping();
          
          return newEntity;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Update entity
      updateEntity: async (id, entityData) => {
        const { processedConfig } = get();
        if (!processedConfig) return;

        set({ isLoading: true, error: null });
        
        try {
          const apiFunctions = ConfigProcessor.getAPIFunctions(processedConfig);
          const updatedEntity = await apiFunctions.updateFn(id, entityData);
          
          const { entities } = get();
          const updatedEntities = entities.map(entity => 
            entity.id === id ? updatedEntity : entity
          );
          set({ entities: updatedEntities });
          get().applyFiltersAndGrouping();
          
          return updatedEntity;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Delete entity
      deleteEntity: async (id) => {
        const { processedConfig } = get();
        if (!processedConfig) return;

        set({ isLoading: true, error: null });
        
        try {
          const apiFunctions = ConfigProcessor.getAPIFunctions(processedConfig);
          await apiFunctions.deleteFn(id);
          
          const { entities, selectedEntity } = get();
          const filteredEntities = entities.filter(entity => entity.id !== id);
          
          set({ 
            entities: filteredEntities,
            selectedEntity: selectedEntity?.id === id ? null : selectedEntity
          });
          get().applyFiltersAndGrouping();
          
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Reset store
      reset: () => set({
        currentEntityType: null,
        processedConfig: null,
        workspaceConfig: {},
        entities: [],
        selectedEntity: null,
        filteredEntities: [],
        groupedEntities: new Map(),
        groupByEmne: false,
        isLoading: false,
        isEditing: false,
        searchTerm: '',
        activeFilters: {},
        sortConfig: { field: 'id', direction: 'desc' },
        error: null
      })
    }),
    { name: 'entity-workspace-store' }
  )
);

export default useEntityWorkspaceStore;