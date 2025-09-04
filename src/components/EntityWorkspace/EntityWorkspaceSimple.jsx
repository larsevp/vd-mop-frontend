/**
 * EntityWorkspaceSimple - Minimal implementation without loops
 * 
 * This is a temporary solution to eliminate the infinite loops
 * by using the simplest possible approach with Zustand.
 */

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { create } from 'zustand';

// Simple store for this component only
const useSimpleEntityStore = create((set, get) => ({
  entities: [],
  loading: false,
  error: null,
  selectedEntity: null,
  searchQuery: '',
  
  setEntities: (entities) => set({ entities }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedEntity: (selectedEntity) => set({ selectedEntity }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  loadEntities: async (dto) => {
    if (!dto || !dto.loadData) {
      console.warn('No DTO or loadData method available');
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      const result = await dto.loadData({});
      set({ 
        entities: result.items || [],
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to load entities',
        loading: false 
      });
    }
  },
  
  reset: () => set({
    entities: [],
    loading: false,
    error: null,
    selectedEntity: null,
    searchQuery: ''
  })
}));

/**
 * EntityWorkspaceSimple - Minimal component
 */
const EntityWorkspaceSimple = ({
  dto = null,
  entityType = null,
  debug = false,
  // Legacy props
  adapter = null,
  modelConfig = null,
  combinedEntityDTO = null,
}) => {
  const navigate = useNavigate();
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Simple store access
  const { 
    entities, 
    loading, 
    error, 
    selectedEntity,
    searchQuery,
    setEntities,
    setLoading,
    setError,
    setSelectedEntity,
    setSearchQuery,
    loadEntities,
    reset
  } = useSimpleEntityStore();

  // Priority: dto > combinedEntityDTO > adapter
  const activeDTO = dto || combinedEntityDTO || (adapter ? { adapter } : null);
  
  // Get display config
  let displayConfig = {};
  if (activeDTO?.getDisplayConfig) {
    displayConfig = activeDTO.getDisplayConfig();
  } else if (activeDTO?.adapter?.getDisplayConfig) {
    displayConfig = activeDTO.adapter.getDisplayConfig();
  } else {
    displayConfig = {
      title: modelConfig?.title || entityType || 'Entities',
      entityTypes: [entityType],
      layout: "split"
    };
  }

  const entityDisplayName = displayConfig.title || "Entities";
  const storeEntityType = displayConfig.entityTypes?.[0] || entityType;

  // Load data once on mount
  useEffect(() => {
    if (!hasLoaded && activeDTO) {
      console.log('EntityWorkspaceSimple: Loading data once for', storeEntityType);
      setHasLoaded(true);
      loadEntities(activeDTO);
    }
  }, [hasLoaded, activeDTO, storeEntityType, loadEntities]);

  // Reset when entity type changes
  useEffect(() => {
    console.log('EntityWorkspaceSimple: Entity type changed, resetting');
    reset();
    setHasLoaded(false);
  }, [storeEntityType, reset]);

  // Event handlers
  const handleEntitySelect = useCallback((entity) => {
    setSelectedEntity(entity);
  }, [setSelectedEntity]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // TODO: Implement search
  }, [setSearchQuery]);

  const handleRefresh = useCallback(() => {
    console.log('EntityWorkspaceSimple: Refreshing');
    if (activeDTO) {
      loadEntities(activeDTO);
    }
  }, [activeDTO, loadEntities]);

  const handleCreateNew = useCallback(() => {
    navigate(`/${storeEntityType}/create`);
  }, [navigate, storeEntityType]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (debug) {
    console.log('EntityWorkspaceSimple: Render', {
      entityType: storeEntityType,
      entitiesCount: entities?.length || 0,
      loading,
      hasError: !!error,
      hasLoaded
    });
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Laster {entityDisplayName.toLowerCase()}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600 mb-4">Kunne ikke laste data</p>
              <p className="text-neutral-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                Prøv igjen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const entityCount = entities?.length || 0;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Tilbake
              </Button>
              
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  {entityDisplayName}
                </h1>
                <p className="text-sm text-neutral-600">
                  {entityCount} elementer
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Oppdater
              </Button>
              
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Opprett ny
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border-b border-neutral-200 px-6 py-3">
          <input
            type="text"
            placeholder="Søk..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Entity List */}
          <div className="w-1/3 bg-white border-r border-neutral-200 overflow-y-auto">
            {entityCount === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                Ingen {entityDisplayName.toLowerCase()} funnet
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {entities.map((entity, index) => (
                  <div
                    key={entity.id || index}
                    onClick={() => handleEntitySelect(entity)}
                    className={`p-4 cursor-pointer hover:bg-neutral-50 ${
                      selectedEntity?.id === entity.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium text-neutral-900 truncate">
                      {entity.title || entity.name || entity.tittel || `Item ${index + 1}`}
                    </div>
                    <div className="text-sm text-neutral-500 truncate">
                      {entity.description || entity.beskrivelse || `ID: ${entity.id}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail View */}
          <div className="flex-1 bg-white">
            {selectedEntity ? (
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">
                  {selectedEntity.title || selectedEntity.name || selectedEntity.tittel || 'Detaljer'}
                </h3>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <pre className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedEntity, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                <p>Velg et element for å se detaljer</p>
              </div>
            )}
          </div>
        </div>

        {/* Debug info */}
        {debug && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded text-xs max-w-sm">
            <div>Entity Type: {storeEntityType}</div>
            <div>Count: {entityCount}</div>
            <div>Loading: {loading.toString()}</div>
            <div>Has Error: {(!!error).toString()}</div>
            <div>Has Loaded: {hasLoaded.toString()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityWorkspaceSimple;