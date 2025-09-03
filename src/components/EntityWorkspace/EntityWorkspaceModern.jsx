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

// UI components
import { EntityFilters, ViewOptionsMenu } from "./shared";
import GenericSearchBar from "./interface/components/GenericSearchBar";
import GenericEntityListRow from "./interface/components/GenericEntityListRow";
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
 * EntityWorkspaceModern - Modern implementation using interface system
 */
const EntityWorkspaceModern = ({ entityType, modelConfig, workspaceConfig = {}, debug = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const isAnyEntityEditing = useIsAnyEntityEditing();

  // Get or create workspace store
  const store = useMemo(() => 
    getWorkspaceStore(entityType, { debug, ...workspaceConfig }), 
    [entityType, debug, workspaceConfig]
  );

  // Use the new interface system
  const workspace = useGenericWorkspace(store, {
    enableDataFetching: true,
    enableActions: true,
    autoInitialize: true,
    userContext: user ? {
      userId: user.id,
      role: user.role,
      permissions: user.permissions || [],
      enhetId: user.enhetId
    } : null,
    debug: debug
  });

  // Resolve configuration
  const resolvedModelConfig = modelConfig || EntityTypeResolver.resolveModelConfig(entityType);
  const workspaceLayout = workspaceConfig?.layout || resolvedModelConfig?.workspace?.layout || 'split';
  const entityDisplayName = resolvedModelConfig?.title || EntityTypeResolver.getDisplayName(entityType, resolvedModelConfig);

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

  // Simple layout rendering
  return (
    <div className="bg-neutral-50">
      <div className="max-w-[1600px] mx-auto" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
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

            <Button
              onClick={handleCreateNew}
              size="default"
              className="flex items-center gap-2"
              disabled={isAnyEntityEditing}
            >
              <Plus className="h-4 w-4" />
              {resolvedModelConfig?.newButtonLabel || `Ny ${entityDisplayName}`}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex gap-4">
            <GenericSearchBar
              searchQuery={workspace.searchInput || ''}
              onSearchChange={(value) => workspace.actions.setSearchInput?.(value)}
              placeholder={`Søk i ${entityDisplayName.toLowerCase()}...`}
              className="flex-1"
              config={{
                entityType: entityType,
                modelConfig: resolvedModelConfig
              }}
            />
            
            <EntityFilters
              filterBy={workspace.filters?.filterBy || 'all'}
              onFilterChange={(filterBy) => workspace.actions.setFilters?.({ filterBy })}
              entityType={entityType}
            >
              <ViewOptionsMenu
                groupByEmne={workspace.groupByEmne || false}
                onGroupByEmneChange={(groupByEmne) => {
                  // Handle grouping toggle
                }}
                showMerknader={workspace.showMerknader || false}
                onShowMerknaderChange={(showMerknader) => {
                  // Handle notes toggle
                }}
              />
            </EntityFilters>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {workspaceLayout === 'split' ? (
            // Split view layout
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">Liste</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {workspace.entities?.map((entity) => (
                    <GenericEntityListRow
                      key={entity.id}
                      entity={entity}
                      onSelect={(entity) => workspace.actions.setSelectedEntity?.(entity)}
                      selected={workspace.selectedEntity?.id === entity.id}
                      onClick={(entity) => workspace.actions.setFocusedEntity?.(entity.id)}
                      config={{
                        entityType: entityType,
                        modelConfig: resolvedModelConfig
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200">
                {workspace.selectedEntity ? (
                  <GenericEntityDetailPane
                    entity={workspace.selectedEntity}
                    onSave={(entity) => workspace.actions.updateEntity?.(entity.id, entity)}
                    onDelete={(entity) => workspace.actions.deleteEntity?.(entity.id)}
                    config={{
                      entityType: entityType,
                      modelConfig: resolvedModelConfig
                    }}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <h3 className="text-lg font-medium mb-2">Velg en {entityDisplayName.toLowerCase()}</h3>
                    <p>Klikk på en {entityDisplayName.toLowerCase()} i listen for å se detaljer</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Card/list view layout
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="divide-y divide-gray-100">
                {workspace.entities?.map((entity) => (
                  <GenericEntityListRow
                    key={entity.id}
                    entity={entity}
                    expandable={true}
                    onSelect={(entity) => workspace.actions.setSelectedEntity?.(entity)}
                    selected={workspace.selectedEntity?.id === entity.id}
                    config={{
                      entityType: entityType,
                      modelConfig: resolvedModelConfig
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Debug Information */}
        {debug && process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/80 text-white text-xs font-mono rounded max-w-sm overflow-auto max-h-96">
            <h3 className="font-bold mb-2">Interface System Debug</h3>
            <div className="space-y-1">
              <div>Entity Type: {entityType}</div>
              <div>Layout: {workspaceLayout}</div>
              <div>Entities: {workspace.entities?.length || 0}</div>
              <div>Loading: {workspace.loading ? '⏳' : '✅'}</div>
              <div>Error: {workspace.error ? '❌' : '✅'}</div>
              <div>Actions Available: {Object.keys(workspace.actions || {}).length}</div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer">Workspace State</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  entities: workspace.entities?.length || 0,
                  loading: workspace.loading,
                  error: workspace.error,
                  filters: workspace.filters,
                  selectedEntity: workspace.selectedEntity?.id,
                  focusedEntity: workspace.focusedEntity
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}

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
  );
};

export default EntityWorkspaceModern;