import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import flow components and utilities
import EmneFlowNode from './EmneFlowNode';
import ProsjektKravFlowNode from './ProsjektKravFlowNode';
import ProsjektTiltakFlowNode from './ProsjektTiltakFlowNode';
import { transformToFlowData, getDefaultFlowSettings } from './flowDataTransformer';

// Import data hook
import { useEntityData } from '@/components/EntityWorkspace/interface/hooks/useEntityData';

// Define node types outside component to prevent recreation
const nodeTypes = {
  emne: EmneFlowNode,
  prosjektKrav: ProsjektKravFlowNode,
  prosjektTiltak: ProsjektTiltakFlowNode,
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
  ui,
  onEntitySelect,
  onFieldSave,
  selectedEntity,
  viewOptions = {},
  className = ''
}) => {
  // Note: nodeTypes defined outside component to prevent recreation

  // Fetch data using the same pattern as EntityWorkspace
  const { data: result, isLoading, error } = useEntityData(dto, {
    searchQuery: ui.activeSearchQuery,
    filters: ui.filters,
    pagination: { page: 1, pageSize: 100 } // Larger page size for flow view
  });

  // Transform data to flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('Flow: Transforming data:', result);
    const flowData = transformToFlowData(result, {
      onEntitySelect,
      onFieldSave
    }, viewOptions);
    console.log('Flow: Generated nodes:', flowData.nodes.length, 'edges:', flowData.edges.length);
    console.log('Flow: Node data:', flowData.nodes);
    console.log('Flow: Edge data:', flowData.edges);
    return flowData;
  }, [result, onEntitySelect, onFieldSave, viewOptions]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update React Flow state when initial data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Debug logging
  console.log('ProjectFlowView: result:', result);
  console.log('ProjectFlowView: isLoading:', isLoading);
  console.log('ProjectFlowView: error:', error);
  console.log('ProjectFlowView: initialNodes:', initialNodes);
  console.log('ProjectFlowView: initialEdges:', initialEdges);
  console.log('ProjectFlowView: current nodes state:', nodes);
  console.log('ProjectFlowView: current edges state:', edges);

  // Handle node clicks
  const onNodeClick = useCallback((event, node) => {
    // Only handle clicks on entity nodes (not emne nodes)
    if (node.type === 'prosjektKrav' || node.type === 'prosjekttiltak') {
      const entity = node.data?.entity;
      if (entity && onEntitySelect) {
        onEntitySelect(entity, 'select');
      }
    }
  }, [onEntitySelect]);

  // Update nodes when selectedEntity changes
  React.useEffect(() => {
    if (selectedEntity?.id) {
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const isSelected = node.data?.entity?.id === selectedEntity.id;
          return {
            ...node,
            selected: isSelected,
            style: {
              ...node.style,
              ...(isSelected && {
                boxShadow: '0 0 0 2px #3b82f6',
                transform: 'scale(1.02)'
              })
            }
          };
        })
      );
    }
  }, [selectedEntity, setNodes]);

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
    <div 
      className={`bg-gray-50`} 
      style={{ 
        width: '100%',
        height: 'calc(100vh - 140px)', // Account for header space
        minHeight: '600px'
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
  );
};

export default ProjectFlowView;