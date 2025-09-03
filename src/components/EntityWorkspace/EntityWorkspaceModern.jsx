/**
 * EntityWorkspaceModern - Clean implementation using new interface system
 * 
 * This is the modern implementation that uses the new interface architecture
 * with clean separation of concerns and improved state management.
 */

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useIsAnyEntityEditing } from "@/stores/editingStateStore";

// New interface system
import { createGenericWorkspaceStore } from "./interface/stores/GenericWorkspaceStore.js";
import { useGenericWorkspace } from "./interface/hooks/GenericStoreHook.js";

// UI components (new design from main branch)
import EntitySplitView from "./interface/components/EntitySplitView";
import EntityListPane from "./interface/components/EntityListPane";
import SearchBar from "./interface/components/SearchBar";
import GenericEntityDetailPane from "./interface/components/GenericEntityDetailPane";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";

// Services
import { EntityTypeResolver } from "./interface/contracts/EntityTypeResolver";

/**
 * Store cache for reusing stores across renders
 */
const storeCache = new Map();

/**
 * Get or create a workspace store for the entity type
 */
const getWorkspaceStore = (entityType, config = {}) => {
  if (!storeCache.has(entityType)) {
    const store = createGenericWorkspaceStore(entityType, {
      debug: config.debug || false,
      ...config
    });
    storeCache.set(entityType, store);
  }
  return storeCache.get(entityType);
};

/**
 * EntityWorkspaceModern - Generic interface using adapter injection
 */
const EntityWorkspaceModern = ({ 
  adapter = null, 
  // Legacy props for backward compatibility (will be deprecated)
  entityType = null, 
  modelConfig = null, 
  workspaceConfig = {}, 
  debug = false 
}) => {
  console.log('EntityWorkspaceModern: Component rendering with props:', {
    hasAdapter: !!adapter,
    legacyEntityType: entityType,
    debug,
    hasModelConfig: !!modelConfig
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const isAnyEntityEditing = useIsAnyEntityEditing();

  // Validate adapter or fall back to legacy mode
  if (!adapter && !entityType) {
    throw new Error('EntityWorkspace requires either adapter prop or legacy entityType prop');
  }

  // Get configuration from adapter or legacy sources
  const displayConfig = adapter ? adapter.getDisplayConfig() : {
    title: modelConfig?.title || EntityTypeResolver.getDisplayName(entityType),
    entityTypes: [entityType],
    supportsGroupByEmne: EntityTypeResolver.supportsGroupByEmne(entityType),
    layout: workspaceConfig?.layout || modelConfig?.workspace?.layout || 'split'
  };

  const filterConfig = adapter ? adapter.getFilterConfig() : {
    // Fallback to hardcoded legacy config
    fields: {
      status: { enabled: true, label: 'Status', placeholder: 'Alle statuser' },
      vurdering: { enabled: true, label: 'Vurdering', placeholder: 'Alle vurderinger' },
      emne: { enabled: true, label: 'Emne', placeholder: 'Alle emner' }
    },
    sortFields: [
      { key: 'updatedAt', label: 'Sist endret' },
      { key: 'title', label: 'Tittel' }
    ],
    defaults: { sortBy: 'updatedAt', sortOrder: 'desc', filterBy: 'all' }
  };

  // Get or create workspace store (use adapter's primary entity type if available)
  const storeEntityType = adapter ? displayConfig.entityTypes[0] : entityType;
  const store = useMemo(() => 
    getWorkspaceStore(storeEntityType, { debug, adapter, ...workspaceConfig }), 
    [storeEntityType, debug, adapter, workspaceConfig]
  );

  // Use the interface system with adapter integration
  const workspace = useGenericWorkspace(store, {
    enableDataFetching: true,
    enableActions: true,
    autoInitialize: true,
    adapter: adapter,
    userContext: user ? {
      userId: user.id,
      role: user.role,
      permissions: user.permissions || [],
      enhetId: user.enhetId
    } : null,
    debug: debug
  });

  // Circuit breaker state
  const [loadAttempted, setLoadAttempted] = React.useState(false);
  const [failureCount, setFailureCount] = React.useState(0);
  const MAX_FAILURES = 1; // Stop after 1 failure

  // Force data loading on mount - but only once with circuit breaker
  useEffect(() => {
    console.log('EntityWorkspaceModern: useEffect triggered', {
      loadAttempted,
      failureCount,
      hasError: !!workspace.error,
      hasEntities: !!workspace.entities?.length,
      isLoading: workspace.loading
    });
    
    // Circuit breaker: Stop if we've exceeded failure count
    if (failureCount >= MAX_FAILURES) {
      console.log('EntityWorkspaceModern: Circuit breaker activated - stopping requests');
      return;
    }
    
    // Only attempt to load once and if no error
    if (!loadAttempted && !workspace.error) {
      console.log('EntityWorkspaceModern: First load attempt');
      setLoadAttempted(true);
      
      if (workspace.actions?.loadEntities) {
        console.log('EntityWorkspaceModern: Using workspace.actions.loadEntities');
        workspace.actions.loadEntities();
      }
    }
  }, [entityType, loadAttempted, failureCount, workspace.error]);

  // Monitor for failures and increment failure count
  useEffect(() => {
    if (workspace.error && loadAttempted) {
      console.log('EntityWorkspaceModern: Error detected, incrementing failure count');
      setFailureCount(prev => prev + 1);
    }
  }, [workspace.error, loadAttempted]);

  // Loading state
  if (workspace.loading) {
    return (
      <div className="bg-neutral-50">
        <div className="max-w-[1600px] mx-auto" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Laster {entityType}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state  
  if (workspace.error) {
    return (
      <div className="bg-neutral-50">
        <div className="max-w-[1600px] mx-auto p-8" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">Feil ved lasting av {entityDisplayName}</h3>
            <p className="text-red-700">{workspace.error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Prøv igjen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle entity creation
  const handleCreateNew = () => {
    if (workspace.actions.createEntity) {
      workspace.actions.createEntity({
        tittel: '',
        beskrivelse: '',
        obligatorisk: false,
        createdBy: user?.id,
        enhetId: user?.enhetId
      });
    }
  };

  // Debug logging - always log to check if debug prop is working
  console.log('EntityWorkspaceModern Debug Check:', {
    entityType,
    debugProp: debug,
    debugType: typeof debug,
    debugBoxShouldShow: !!debug,
    workspaceEntities: workspace.entities?.length,
    workspaceLoading: workspace.loading,
    workspaceError: workspace.error
  });
  
  // Also log when debug is true
  if (debug) {
    console.log('DEBUG BOX SHOULD BE VISIBLE!');
  }

  // Simple layout rendering
  return (
    <>
      {/* Debug Info - Outside main container to prevent clipping */}
      {debug && (
        <div className="fixed bottom-4 right-4 z-[9999] p-3 bg-black/90 text-white text-xs font-mono rounded max-w-xs shadow-lg">
          <div className="font-bold text-blue-300 mb-1">🐛 Interface Debug</div>
          <div className="space-y-0.5">
            <div>Entity: <span className="text-blue-300">{entityType}</span></div>
            <div>New Interface: <span className="text-green-300">✅</span></div>
            <div>Legacy Store: <span className="text-red-300">❌</span></div>
            <div>Bridge Active: <span className="text-green-300">✅</span></div>
            <div>Entities: <span className="text-cyan-300">{workspace.entities?.length || 0}</span></div>
            <div>Loading: <span className={workspace.loading ? "text-yellow-300" : "text-gray-400"}>{workspace.loading ? '⏳' : '❌'}</span></div>
            <div>Error: <span className={workspace.error ? "text-red-300" : "text-green-300"}>{workspace.error ? '❌' : '✅'}</span></div>
            {workspace.error && (
              <div className="mt-1 p-1 bg-red-900/50 rounded text-red-200 text-xs max-h-20 overflow-auto">
                {workspace.error}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-neutral-50">
        <div className="max-w-[1600px] mx-auto" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
        
        {/* Header with Search on same line */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left side: Back + Title + Count */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors"
                title="Tilbake"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Tilbake</span>
              </button>
              
              <h1 className="text-xl font-semibold text-neutral-900">{entityDisplayName}</h1>
              
              <div className="text-sm text-neutral-600">
                {workspace.entities?.length || 0} totalt
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md">
              <SearchBar
                searchInput={workspace.searchQuery || ''}
                onSearchInputChange={(value) => workspace.actions.setSearchInput?.(value)}
                onSearch={() => workspace.actions.loadEntities?.()}
                onClearSearch={() => {
                  workspace.actions.setSearchInput?.('');
                  workspace.actions.loadEntities?.();
                }}
                isLoading={workspace.loading}
                placeholder={`Søk i ${entityDisplayName.toLowerCase()}...`}
                mode="advanced"
                filterBy={workspace.filters?.filterBy || 'all'}
                sortBy={workspace.filters?.sortBy || 'updatedAt'}
                sortOrder={workspace.filters?.sortOrder || 'desc'}
                onFilterChange={(filterBy) => workspace.actions.setFilters?.({ 
                  ...workspace.filters, 
                  filterBy 
                })}
                onSortChange={(sortBy) => workspace.actions.setFilters?.({ 
                  ...workspace.filters, 
                  sortBy 
                })}
                onSortOrderChange={(sortOrder) => workspace.actions.setFilters?.({ 
                  ...workspace.filters, 
                  sortOrder 
                })}
                entityType={entityType}
                additionalFilters={workspace.filters?.additionalFilters || {}}
                onAdditionalFiltersChange={(additionalFilters) => workspace.actions.setFilters?.({ 
                  ...workspace.filters, 
                  additionalFilters 
                })}
                availableStatuses={workspace.availableFilters?.statuses || []}
                availableVurderinger={workspace.availableFilters?.vurderinger || []}
              />
            </div>

            {/* Right side: New Button */}
            <Button
              onClick={handleCreateNew}
              size="default"
              className="flex items-center gap-2 flex-shrink-0"
              disabled={isAnyEntityEditing}
            >
              <Plus className="h-4 w-4" />
              {resolvedModelConfig?.newButtonLabel || `Ny ${entityDisplayName}`}
            </Button>
          </div>
        </div>


        {/* Main Content - EntitySplitView with proper design */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <EntitySplitView
            entities={workspace.entities || []}
            entityType={entityType}
            selectedEntity={workspace.selectedEntity}
            onEntitySelect={(entity) => workspace.actions.setSelectedEntity?.(entity)}
            renderListPane={({ entities, selectedEntity, onEntitySelect }) => (
              <div className="h-full bg-white">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {entities.length} {entities.length === 1 ? entityDisplayName.toLowerCase() : entityDisplayName.toLowerCase() + 'er'}
                    </h3>
                    {workspace.loading && <div className="text-sm text-gray-500">Laster...</div>}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {entities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>{workspace.loading ? "Laster..." : "Ingen elementer funnet"}</p>
                    </div>
                  ) : (
                    <div>
                      {entities.map((entity, index) => (
                        <div
                          key={entity.id || index}
                          className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedEntity?.id === entity.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                          }`}
                          onClick={() => onEntitySelect(entity)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {entity.uid || entity.id}
                                </span>
                                <span className="font-medium text-gray-900 truncate">
                                  {entity.title || "Uten tittel"}
                                </span>
                                {entity.entityType && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    entity.entityType.toLowerCase().includes('krav') 
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {entity.entityType}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {entity.descriptionCard || 'Ingen beskrivelse'}
                              </div>
                              {entity.emne && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {entity.emne.navn || entity.emne.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            renderDetailPane={({ selectedEntity }) => (
              <div className="h-full overflow-auto bg-white">
                {selectedEntity ? (
                  <GenericEntityDetailPane
                    entity={selectedEntity}
                    onSave={(entity) => workspace.actions.updateEntity?.(entity.id, entity)}
                    onDelete={(entity) => workspace.actions.deleteEntity?.(entity.id)}
                    config={{
                      entityType: entityType,
                      modelConfig: resolvedModelConfig
                    }}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Velg en {entityDisplayName.toLowerCase()}</h3>
                      <p>Klikk på en {entityDisplayName.toLowerCase()} i listen for å se detaljer</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          />
        </div>


        {/* Toast Notifications */}
        <Toast
          show={workspace.toast?.show || false}
          message={workspace.toast?.message || ''}
          type={workspace.toast?.type || 'success'}
          onClose={() => {
            // Handle toast close
          }}
        />
      </div>
    </div>
    </>
  );
};

export default EntityWorkspaceModern;