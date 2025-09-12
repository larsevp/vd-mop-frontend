import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';

// Import flow components and utilities
import EmneFlowNode from './EmneFlowNode';
import KravFlowNode from './KravFlowNode';
import TiltakFlowNode from './TiltakFlowNode';
import { transformToFlowData, getDefaultFlowSettings } from './flowDataTransformer';

// Import data hook and UI state
import { useEntityData } from '@/components/EntityWorkspace/interface/hooks/useEntityData';
import { useWorkspaceUI } from '@/components/EntityWorkspace/interface/hooks/useWorkspaceUI';
// Using renderSearchBar prop like other workspaces

// Define node types outside component to prevent recreation
const nodeTypes = {
  emne: EmneFlowNode,
  prosjektKrav: KravFlowNode,
  prosjektTiltak: TiltakFlowNode,
};

/**
 * ProjectFlowView - React Flow visualization for ProsjektKrav/ProsjektTiltak relationships
 * 
 * Features:
 * - Visual project structure: Emne → ProsjektKrav → ProsjektTiltak
 * - Reuses existing EntityCard components for consistency
 * - Interactive nodes with click-to-select functionality
 * - Drag and zoom navigation
 * - Mini-map for large projects
 */
const ProjectFlowView = ({
  dto,
  viewOptions = {},
  renderListHeading,
  renderSearchBar,
  onFlowToggle, // Add flow toggle handler
  className = ''
}) => {
  // Note: nodeTypes defined outside component to prevent recreation

  // UI state management (same as EntityWorkspace)
  const ui = useWorkspaceUI();
  
  // Fetch data using the same pattern as EntityWorkspace  
  const { data: result, isLoading, error } = useEntityData(dto, {
    searchQuery: ui.activeSearchQuery,
    filters: ui.filters,
    pagination: { page: 1, pageSize: 100 } // Larger page size for flow view
  });

  // Entity type for search placeholder
  const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "entities";

  // Handle search like EntityWorkspace does
  const handleSearch = useCallback(() => {
    ui.executeSearch(); // Update activeSearchQuery from searchInput
    // TanStack Query will automatically refetch when activeSearchQuery changes
  }, [ui.executeSearch]);

  // Transform data to flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return transformToFlowData(result, { dto }, viewOptions);
  }, [result, viewOptions, dto]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update React Flow state when initial data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node clicks
  const onNodeClick = useCallback((event, node) => {
    // Only handle clicks on entity nodes (not emne nodes)
    if (node.type === 'prosjektKrav' || node.type === 'prosjekttiltak') {
      const entity = node.data?.entity;
      if (entity) {
        // Could add selection logic here later
      }
    }
  }, []);

  // Note: Node selection could be added here later if needed

  // Flow settings
  const flowSettings = getDefaultFlowSettings();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">Loading...</div>
          <div className="text-sm text-gray-600">Fetching project data for flow visualization...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600 mb-2">Error</div>
          <div className="text-sm text-gray-600">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }} className="flex flex-col bg-gray-50">
      {/* Flow header with inline search */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-900">
            Flow Visualization
          </div>
          
          {/* Search bar using renderSearchBar prop - same configuration as EntityWorkspace */}
          <div className="flex-1 max-w-lg">
            {renderSearchBar({
              searchInput: ui.searchInput,
              onSearchInputChange: ui.setSearchInput,
              onSearch: handleSearch,
              onClearSearch: () => {
                ui.setSearchInput("");
                ui.setActiveSearchQuery("");
                ui.resetFilters();
              },
              isLoading: isLoading,
              placeholder: `Søk i ${entityType}...`,
              mode: "advanced", // Use advanced mode like EntityWorkspace
              filterBy: ui.filters.filterBy,
              sortBy: ui.filters.sortBy,
              sortOrder: ui.filters.sortOrder,
              onFilterChange: (filterBy) => ui.setFilters({ filterBy }),
              onSortChange: (sortBy) => ui.setFilters({ sortBy }),
              onSortOrderChange: (sortOrder) => ui.setFilters({ sortOrder }),
              entityType: entityType,
              additionalFilters: ui.filters.additionalFilters,
              onAdditionalFiltersChange: (additionalFilters) => ui.setFilters({ additionalFilters }),
              filterConfig: dto?.getFilterConfig?.(),
              availableFilters: result?.availableFilters || {},
              viewOptions: viewOptions,
              customFilterFields: []
            })}
          </div>
          
          {/* Back to regular view button */}
          {onFlowToggle && (
            <Button
              variant="ghost"
              onClick={onFlowToggle}
              className="h-8 w-8 p-0"
              title="Back to regular view"
            >
              <Network className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Flow container with absolute dimensions */}
      <div 
        style={{ 
          width: '100%',
          height: '800px',
          position: 'relative'
        }}
      >
      <ReactFlow
        key={`flow-${nodes.length}-${edges.length}`}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView={true}
        fitViewOptions={{ padding: 0.3 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        style={{ width: '100%', height: '100%' }}
        className="react-flow-container"
      >
        {/* Background pattern */}
        <Background 
          variant="dots" 
          gap={20} 
          size={1}
          color="#e5e7eb"
        />
        
        {/* Navigation controls */}
        <Controls 
          position="bottom-left"
          showInteractive={false}
        />
        
        {/* Mini-map for overview */}
        <MiniMap 
          position="bottom-right"
          nodeColor={(node) => {
            switch (node.type) {
              case 'emne': return '#a855f7';
              case 'prosjektKrav': return '#3b82f6';
              case 'prosjekttiltak': return '#10b981';
              default: return '#6b7280';
            }
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(240, 240, 240, 0.8)"
        />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
          <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Emne (Subject Area)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">ProsjektKrav</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">ProsjektTiltak</span>
            </div>
          </div>
          
          {/* Flow direction indicator */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span>Flow:</span>
                <span className="text-purple-600">Emne</span>
                <span>→</span>
                <span className="text-blue-600">Krav</span>
                <span>→</span>
                <span className="text-green-600">Tiltak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No data to visualize</h3>
              <p className="text-sm">Load some ProsjektKrav and ProsjektTiltak entities to see the flow visualization.</p>
            </div>
          </div>
        )}
      </ReactFlow>
      </div>
    </div>
  );
};

export default ProjectFlowView;