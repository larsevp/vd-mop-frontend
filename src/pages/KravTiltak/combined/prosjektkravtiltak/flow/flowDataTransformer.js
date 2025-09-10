/**
 * flowDataTransformer.js - Transform combined entity data to React Flow format
 * 
 * Converts data from ProsjektKravTiltakCombinedAdapter into nodes and edges
 * for React Flow visualization with right-to-left flow: Emne → ProsjektKrav → ProsjektTiltak
 */

// Import flow node components
import EmneFlowNode from './EmneFlowNode';
import ProsjektKravFlowNode from './ProsjektKravFlowNode';
import ProsjektTiltakFlowNode from './ProsjektTiltakFlowNode';

/**
 * Transform combined entity data to React Flow nodes and edges
 * @param {Object} combinedData - Data from ProsjektKravTiltakCombinedAdapter
 * @param {Object} handlers - Event handlers (onEntitySelect, onFieldSave)
 * @param {Object} viewOptions - Current view options
 * @returns {Object} { nodes, edges } for React Flow
 */
export const transformToFlowData = (combinedData, handlers = {}, viewOptions = {}) => {
  const nodes = [];
  const edges = [];
  
  if (!combinedData?.items || !Array.isArray(combinedData.items)) {
    return { nodes, edges };
  }

  // Spacing configuration
  const EMNE_X = 0;     // Leftmost
  const KRAV_X = 500;   // Middle  
  const TILTAK_X = 1000; // Rightmost
  const EMNE_SPACING = 400;
  const KRAV_SPACING = 160;
  const TILTAK_SPACING = 120;

  // Process each emne group
  combinedData.items.forEach((groupData, emneIndex) => {
    const emne = groupData.group?.emne;
    const entities = groupData.items || [];
    
    if (!emne) return; // Skip if no emne

    // Filter entities by type
    const kravEntities = entities.filter(e => e.entityType === 'prosjektkrav');
    const tiltakEntities = entities.filter(e => e.entityType === 'prosjekttiltak');
    
    // Create Emne node (rightmost)
    const emneNodeId = `emne-${emne.id || emneIndex}`;
    nodes.push({
      id: emneNodeId,
      type: 'emne',
      position: { 
        x: EMNE_X, 
        y: emneIndex * EMNE_SPACING 
      },
      data: { 
        emne,
        kravCount: kravEntities.length,
        tiltakCount: tiltakEntities.length
      }
    });

    // Create ProsjektKrav nodes (middle)
    kravEntities.forEach((krav, kravIndex) => {
      const kravNodeId = `krav-${krav.id}`;
      const kravY = (emneIndex * EMNE_SPACING) + (kravIndex * KRAV_SPACING);
      
      nodes.push({
        id: kravNodeId,
        type: 'prosjektKrav',
        position: { x: KRAV_X, y: kravY },
        data: { 
          entity: krav,
          onEntitySelect: handlers.onEntitySelect,
          onFieldSave: handlers.onFieldSave,
          viewOptions
        }
      });

      // Edge: Emne → ProsjektKrav
      edges.push({
        id: `${emneNodeId}-${kravNodeId}`,
        source: emneNodeId,
        target: kravNodeId,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        type: 'smoothstep'
      });

      // Find related ProsjektTiltak for this ProsjektKrav
      const relatedTiltak = tiltakEntities.filter(tiltak => {
        // Check for relationship via prosjektKrav array or direct reference
        return tiltak.prosjektKrav?.some(pk => pk.id === krav.id) ||
               tiltak.prosjektKravId === krav.id ||
               tiltak._relatedToKrav === String(krav.id);
      });

      // Create ProsjektTiltak nodes (leftmost)
      relatedTiltak.forEach((tiltak, tiltakIndex) => {
        const tiltakNodeId = `tiltak-${tiltak.id}`;
        const tiltakY = kravY + (tiltakIndex * TILTAK_SPACING);
        
        nodes.push({
          id: tiltakNodeId,
          type: 'prosjektTiltak',
          position: { x: TILTAK_X, y: tiltakY },
          data: { 
            entity: tiltak,
            onEntitySelect: handlers.onEntitySelect,
            onFieldSave: handlers.onFieldSave,
            viewOptions
          }
        });

        // Edge: ProsjektKrav → ProsjektTiltak  
        edges.push({
          id: `${kravNodeId}-${tiltakNodeId}`,
          source: kravNodeId,
          target: tiltakNodeId,
          style: { stroke: '#10b981', strokeWidth: 2 },
          type: 'smoothstep'
        });
      });
    });

    // Handle standalone ProsjektTiltak (not connected to ProsjektKrav in this emne)
    const standaloneTiltak = tiltakEntities.filter(tiltak => {
      // Check if this tiltak is NOT already connected to any krav in this emne
      return !kravEntities.some(krav => 
        tiltak.prosjektKrav?.some(pk => pk.id === krav.id) ||
        tiltak.prosjektKravId === krav.id ||
        tiltak._relatedToKrav === String(krav.id)
      );
    });

    standaloneTiltak.forEach((tiltak, tiltakIndex) => {
      const tiltakNodeId = `standalone-tiltak-${tiltak.id}`;
      const tiltakY = (emneIndex * EMNE_SPACING) + 200 + (tiltakIndex * TILTAK_SPACING);
      
      nodes.push({
        id: tiltakNodeId,
        type: 'prosjektTiltak',
        position: { x: TILTAK_X, y: tiltakY },
        data: { 
          entity: tiltak,
          onEntitySelect: handlers.onEntitySelect,
          onFieldSave: handlers.onFieldSave,
          viewOptions,
          isStandalone: true
        }
      });

      // Optional: Connect standalone tiltak directly to emne
      edges.push({
        id: `${emneNodeId}-${tiltakNodeId}`,
        source: emneNodeId,
        target: tiltakNodeId,
        style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
        type: 'smoothstep'
      });
    });
  });

  return { nodes, edges };
};

/**
 * Get node types configuration for React Flow
 */
export const getNodeTypes = () => {
  return {
    emne: EmneFlowNode,
    prosjektKrav: ProsjektKravFlowNode,
    prosjektTiltak: ProsjektTiltakFlowNode
  };
};

/**
 * Default React Flow settings
 */
export const getDefaultFlowSettings = () => ({
  nodesDraggable: true,
  nodesConnectable: false,
  elementsSelectable: true,
  fitView: true,
  fitViewOptions: { padding: 0.2 },
  defaultViewport: { x: 0, y: 0, zoom: 0.8 },
  minZoom: 0.2,
  maxZoom: 2
});