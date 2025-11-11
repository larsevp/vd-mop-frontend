import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Columns3, Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';

// Import horizontal flow components and utilities
import EmneFlowNode from '../components/EmneFlowNode';
import KravFlowNode from '../components/KravFlowNode';
import TiltakFlowNode from '../components/TiltakFlowNode';
import { transformToFlowData, getDefaultFlowSettings } from '../adapter/flowDataTransformer';

// Import vertical flow components and utilities
import EmneFlowNodeVertical from '../layouts/vertical/components/EmneFlowNode';
import KravFlowNodeVertical from '../layouts/vertical/components/KravFlowNode';
import TiltakFlowNodeVertical from '../layouts/vertical/components/TiltakFlowNode';
import { transformToVerticalFlow } from '../layouts/vertical/verticalTransformer';

// Import data hook and UI state
import { useEntityData } from '@/components/EntityWorkspace/interface/hooks/useEntityData';
import { useWorkspaceUI } from '@/components/EntityWorkspace/interface/hooks/useWorkspaceUI';

// Import Combined DTO and renderer - following established pattern
import { createCombinedEntityDTO } from '@/components/EntityWorkspace/interface/data';
import { createProsjektKravTiltakCombinedAdapter } from '../../combined/prosjektkravtiltak/adapter';
import { createCombinedRenderer } from '../../combined/shared/CombinedRenderer';
import { renderEntityCard as ProsjektKravCardRenderer } from '../../prosjektkrav/renderer/ProsjektKravRenderer';
import { renderEntityCard as ProsjektTiltakCardRenderer } from '../../prosjekttiltak/renderer/ProsjektTiltakRenderer';
import { renderDetailPane as ProsjektKravDetailRenderer } from '../../prosjektkrav/renderer/ProsjektKravDetailRenderer';
import { renderDetailPane as ProsjektTiltakDetailRenderer } from '../../prosjekttiltak/renderer/ProsjektTiltakDetailRenderer';
import { createProsjektKravAdapter } from '../../prosjektkrav/adapter';
import { createProsjektTiltakAdapter } from '../../prosjekttiltak/adapter';
import { prosjektKrav as prosjektKravConfig } from '@/modelConfigs/models/prosjektKrav';
import { prosjektTiltak as prosjektTiltakConfig } from '@/modelConfigs/models/prosjektTiltak';

// Define node types outside component to prevent recreation
const horizontalNodeTypes = {
  emne: EmneFlowNode,
  krav: KravFlowNode,
  prosjektkrav: KravFlowNode,
  tiltak: TiltakFlowNode,
  prosjekttiltak: TiltakFlowNode,
};

const verticalNodeTypes = {
  emneNode: EmneFlowNodeVertical,
  kravNode: KravFlowNodeVertical,
  tiltakNode: TiltakFlowNodeVertical,
  // Fallback compatibility for transition period
  emne: EmneFlowNodeVertical,
  krav: KravFlowNodeVertical,
  tiltak: TiltakFlowNodeVertical,
  prosjektkrav: KravFlowNodeVertical,
  prosjekttiltak: TiltakFlowNodeVertical,
};

/**
 * FlowWorkspace - Generic React Flow visualization workspace
 * 
 * Features:
 * - Works with any FlowAdapter that implements FlowAdapterInterface
 * - Visual project structure with relationships
 * - Interactive nodes with click-to-select functionality
 * - Drag and zoom navigation
 * - Mini-map for large projects
 * - Integrated search and filtering
 */
const FlowWorkspace = ({
  flowAdapter,           // FlowAdapter instance
  renderSearchBar,       // Search bar renderer function
  onFlowToggle,         // Function to exit flow mode
  nodeTypes: customNodeTypes, // Optional custom node types
  className = '',
  viewOptions = {},
  singleEntityDTO = null,      // Optional single entity DTO for single-entity flows
  transformData = null,        // Optional data transformer for single entity flows
  singleEntityDetailRenderer = null // Optional detail renderer for single entity flows
}) => {
  // UI state management
  const ui = useWorkspaceUI();

  const queryClient = useQueryClient();

  // Layout mode state (persisted to localStorage)
  const [layoutMode, setLayoutMode] = useState(() => {
    const saved = localStorage.getItem('flowLayoutMode');
    return saved || 'horizontal'; // 'horizontal' or 'vertical'
  });

  // Modal state for EntityDetailPane
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showDetailPane, setShowDetailPane] = useState(false);

  // Handle layout toggle
  const handleLayoutToggle = useCallback(() => {
    const newMode = layoutMode === 'horizontal' ? 'vertical' : 'horizontal';
    setLayoutMode(newMode);
    localStorage.setItem('flowLayoutMode', newMode);
  }, [layoutMode]);
  
  // Use either provided single entity DTO or create combined DTO
  const dto = useMemo(() => {
    if (singleEntityDTO) {
      return singleEntityDTO;
    }
    // Default: Use the existing ProsjektKravTiltakCombinedAdapter - don't reinvent!
    // This provides all CRUD operations and follows established patterns  
    const combinedAdapter = createProsjektKravTiltakCombinedAdapter({ debug: true });
    return createCombinedEntityDTO(combinedAdapter, { debug: true });
  }, [singleEntityDTO]);
  
  // Fetch data using DTO - following established pattern
  const { data: flowData, isLoading, error } = useEntityData(dto, {
    searchQuery: ui.activeSearchQuery,
    filters: ui.filters,
    pagination: { page: 1, pageSize: 100 } // Larger page size for flow view
  });


  // Use custom node types if provided, otherwise use layout-specific defaults
  // Memoize to prevent recreation on every render
  const effectiveNodeTypes = useMemo(() => {
    return customNodeTypes || (layoutMode === 'vertical' ? verticalNodeTypes : horizontalNodeTypes);
  }, [customNodeTypes, layoutMode]);

  // Entity type for search placeholder
  const entityTypes = flowAdapter?.getSupportedEntityTypes?.() || ["entities"];
  const entityType = entityTypes.join(" + ");

  // Handle search
  const handleSearch = useCallback(() => {
    ui.executeSearch();
  }, [ui.executeSearch]);

  // Transform data to flow format (dispatch to layout-specific transformer)
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!flowData) {
      return { nodes: [], edges: [] };
    }

    // Select transformer based on layout mode
    const transformer = layoutMode === 'vertical' ? transformToVerticalFlow : transformToFlowData;

    // Handle single entity DTO case with custom transformation
    if (singleEntityDTO && transformData) {
      const transformedData = transformData(flowData);
      // Convert the transformed single entity data to FlowAdapter format
      let flowAdapterData;
      if (transformedData.isGrouped && transformedData.items) {
        flowAdapterData = {
          emneGroups: transformedData.items.map((group, index) => ({
            emne: group.group?.emne || { navn: 'Ingen emne', id: null },
            emneIndex: index,
            kravEntities: group.items?.filter(item => item.entityType?.toLowerCase().includes('krav')) || [],
            tiltakEntities: group.items?.filter(item => item.entityType?.toLowerCase().includes('tiltak')) || [],
            totalEntities: group.items?.length || 0
          })),
          allEntities: transformedData.items.flatMap(group => group.items || []),
          relationships: {
            kravToKrav: [],
            tiltakToTiltak: [],
            tiltakToKrav: []
          }
        };
      } else {
        // Fallback for non-grouped single entity data
        flowAdapterData = {
          emneGroups: [],
          allEntities: transformedData.items || [],
          relationships: {
            kravToKrav: [],
            tiltakToTiltak: [],
            tiltakToKrav: []
          }
        };
      }
      return transformer(flowAdapterData, { dto }, viewOptions);
    }

    // Default: Convert CombinedEntityDTO format to FlowAdapter format
    let flowAdapterData;
    if (flowData.isGrouped && flowData.items) {
      // Transform from EntityWorkspace grouped format to FlowAdapter format
      flowAdapterData = {
        emneGroups: flowData.items.map((group, index) => ({
          emne: group.group?.emne || { navn: 'Ingen emne', id: null },
          emneIndex: index,
          kravEntities: group.items?.filter(item => item.entityType?.toLowerCase().includes('krav')) || [],
          tiltakEntities: group.items?.filter(item => item.entityType?.toLowerCase().includes('tiltak')) || [],
          totalEntities: group.items?.length || 0
        })),
        allEntities: flowData.items.flatMap(group => group.items || []),
        relationships: {
          kravToKrav: [],
          tiltakToTiltak: [],
          tiltakToKrav: []
        }
      };
    } else {
      // Fallback for non-grouped data
      flowAdapterData = {
        emneGroups: [],
        allEntities: flowData.items || [],
        relationships: {
          kravToKrav: [],
          tiltakToTiltak: [],
          tiltakToKrav: []
        }
      };
    }

    return transformer(flowAdapterData, { dto }, viewOptions);
  }, [flowData, viewOptions, dto, singleEntityDTO, transformData, layoutMode]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update React Flow state when initial data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node double-clicks to open EntityDetailPane
  const onNodeDoubleClick = useCallback((event, node) => {
    // Only handle double-clicks on entity nodes (not emne nodes)
    if (node.type === 'prosjektkrav' || node.type === 'prosjekttiltak') {
      const entity = node.data?.entity;
      if (entity) {
        setSelectedEntity(entity);
        setShowDetailPane(true);
      }
    }
  }, []);

  // Handle node clicks (single click - could be used for selection later)
  const onNodeClick = useCallback((event, node) => {
    // Single click handling - reserved for future selection features
  }, []);

  // EntityDetailPane handlers
  const handleDetailPaneClose = useCallback(() => {
    setShowDetailPane(false);
    setSelectedEntity(null);
  }, []);

  const handleEntitySave = useCallback(async (saveData, isUpdate) => {
    try {
      // Use DTO's save method (works for both CombinedEntityDTO and SingleEntityDTO)
      await dto.save(saveData, isUpdate);
      
      // Get entity type for cache invalidation
      const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "unknown";
      
      // Invalidate multiple query key patterns to ensure comprehensive cache refresh
      const queryPatterns = [
        ["entities", entityType],
        ["entities", entityType.toLowerCase()],
        ["entities"]
      ];
      
      for (const pattern of queryPatterns) {
        await queryClient.invalidateQueries({
          queryKey: pattern,
          exact: false // Invalidate all matching queries regardless of other parameters
        });
      }
      
      handleDetailPaneClose();
    } catch (error) {
      console.error('Save failed:', error);
      // TODO: Show error message to user
    }
  }, [dto, handleDetailPaneClose, queryClient]);

  const handleEntityDelete = useCallback(async (entity) => {
    try {
      // Use DTO's delete method (works for both CombinedEntityDTO and SingleEntityDTO)
      await dto.delete(entity);
      
      // Get entity type for cache invalidation
      const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "unknown";
      
      // Invalidate multiple query key patterns to ensure comprehensive cache refresh
      const queryPatterns = [
        ["entities", entityType],
        ["entities", entityType.toLowerCase()],
        ["entities"]
      ];
      
      for (const pattern of queryPatterns) {
        await queryClient.invalidateQueries({
          queryKey: pattern,
          exact: false // Invalidate all matching queries regardless of other parameters
        });
      }
      
      handleDetailPaneClose();
    } catch (error) {
      console.error('Delete failed:', error);
      // TODO: Show error message to user
    }
  }, [dto, handleDetailPaneClose, queryClient]);

  // Create renderer following established pattern
  const renderer = useMemo(() => {
    // For single entity flows, use provided renderer or create appropriate single renderer
    if (singleEntityDTO && singleEntityDetailRenderer) {
      return {
        renderDetailPane: singleEntityDetailRenderer
      };
    }
    
    // Default: Create combined renderer
    return createCombinedRenderer({
      entityTypes: {
        primary: "prosjektKrav",
        secondary: "prosjektTiltak",
      },
      cardRenderers: {
        primaryCardRenderer: ProsjektKravCardRenderer,
        secondaryCardRenderer: ProsjektTiltakCardRenderer,
      },
      renderers: {
        primaryDetailRenderer: ProsjektKravDetailRenderer,
        secondaryDetailRenderer: ProsjektTiltakDetailRenderer,
      },
      adapters: {
        primaryAdapter: createProsjektKravAdapter(prosjektKravConfig),
        secondaryAdapter: createProsjektTiltakAdapter(prosjektTiltakConfig),
      },
      labels: {
        primaryCreate: "Nytt krav",
        secondaryCreate: "Nytt tiltak",
        primaryCount: "prosjektkrav", 
        secondaryCount: "prosjekttiltak",
        workspaceType: "prosjektkrav-tiltak-flow",
      },
      viewOptions: {}
    });
  }, [singleEntityDTO, singleEntityDetailRenderer]);

  // Get appropriate detail renderer for selected entity using renderer
  const renderEntityDetail = useCallback((entity) => {
    if (!entity) return null;
    
    const rendererProps = {
      onSave: handleEntitySave,
      onDelete: handleEntityDelete,
      onClose: handleDetailPaneClose
    };
    
    return renderer.renderDetailPane(entity, rendererProps);
  }, [renderer, handleEntitySave, handleEntityDelete, handleDetailPaneClose]);

  // Flow settings
  const flowSettings = getDefaultFlowSettings();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">Loading...</div>
          <div className="text-sm text-gray-600">Fetching data for flow visualization...</div>
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
    <div style={{ width: '100%', height: '100vh' }} className={`flex flex-col bg-gray-50 ${className}`}>
      {/* Flow header with inline search */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-900">
            Flow Visualization - {entityType}
          </div>
          
          {/* Search bar using renderSearchBar prop */}
          {renderSearchBar && (
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
                mode: "advanced",
                filterBy: ui.filters.filterBy,
                sortBy: ui.filters.sortBy,
                sortOrder: ui.filters.sortOrder,
                onFilterChange: (filterBy) => ui.setFilters({ filterBy }),
                onSortChange: (sortBy) => ui.setFilters({ sortBy }),
                onSortOrderChange: (sortOrder) => ui.setFilters({ sortOrder }),
                entityType: entityType,
                additionalFilters: ui.filters.additionalFilters,
                onAdditionalFiltersChange: (additionalFilters) => ui.setFilters({ additionalFilters }),
                viewOptions: viewOptions,
                filterConfig: dto?.getFilterConfig?.(), // Add missing filter config
                availableFilters: flowData?.availableFilters || {}, // Add missing available filters
                customFilterFields: []
              })}
            </div>
          )}

          {/* Layout toggle button */}
          <Button
            variant="ghost"
            onClick={handleLayoutToggle}
            className="h-8 w-8 p-0"
            title={layoutMode === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
          >
            {layoutMode === 'horizontal' ? <Columns2 className="w-4 h-4" /> : <Columns3 className="w-4 h-4" />}
          </Button>

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
      
      {/* Flow container */}
      <div 
        style={{ 
          width: '100%',
          height: '800px',
          position: 'relative'
        }}
      >
        <ReactFlow
          key={`flow-${layoutMode}-${nodes.length}-${edges.length}`}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={effectiveNodeTypes}
          fitView={true}
          fitViewOptions={{ padding: layoutMode === 'vertical' ? 0.2 : 0.3 }}
          defaultViewport={{ x: 0, y: 0, zoom: layoutMode === 'vertical' ? 0.4 : 0.5 }}
          minZoom={0.1}
          maxZoom={2}
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
                case 'krav':
                case 'prosjektKrav': return '#3b82f6';
                case 'tiltak':
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
                <span className="text-sm text-gray-700">Krav</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Tiltak</span>
              </div>
            </div>

            {/* Flow direction indicator - dynamic based on layout */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {layoutMode === 'horizontal' ? (
                  <div className="flex items-center gap-1">
                    <span>Flow:</span>
                    <span className="text-purple-600">Emne</span>
                    <span>→</span>
                    <span className="text-blue-600">Krav</span>
                    <span>→</span>
                    <span className="text-green-600">Tiltak</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">Columnar Layout</div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-purple-600">Emne</span>
                      <span>↓</span>
                      <span className="text-blue-600">Krav</span>
                      <span>↓</span>
                      <span className="text-green-600">Tiltak</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium mb-2">No data to visualize</h3>
                <p className="text-sm">Load some entities to see the flow visualization.</p>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>

      {/* EntityDetailPane Modal - z-[100] ensures it appears above status line and other UI elements */}
      {showDetailPane && selectedEntity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto">
              {renderEntityDetail(selectedEntity)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowWorkspace;