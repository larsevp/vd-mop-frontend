import React, { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { LayoutGrid, Columns, Network } from "lucide-react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createProsjektKravTiltakCombinedAdapter } from "./adapter";
import { createCombinedRenderer } from "../shared/CombinedRenderer";
import { useProsjektKravTiltakCombinedViewStore } from "./store";
import { RowListHeading } from "../../shared";
import ProjectFlowView from "./flow/ProjectFlowView";

// Import individual renderers
import { renderEntityCard as ProsjektKravCardRenderer } from "../../prosjektkrav/renderer/ProsjektKravRenderer";
import { renderEntityCard as ProsjektTiltakCardRenderer } from "../../prosjekttiltak/renderer/ProsjektTiltakRenderer";
import { renderDetailPane as ProsjektKravDetailRenderer } from "../../prosjektkrav/renderer/ProsjektKravDetailRenderer";
import { renderDetailPane as ProsjektTiltakDetailRenderer } from "../../prosjekttiltak/renderer/ProsjektTiltakDetailRenderer";
import { createProsjektKravAdapter } from "../../prosjektkrav/adapter";
import { createProsjektTiltakAdapter } from "../../prosjekttiltak/adapter";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";
import { useEntityData } from "@/components/EntityWorkspace/interface/hooks/useEntityData";
import { useWorkspaceUI } from "@/components/EntityWorkspace/interface/hooks/useWorkspaceUI";

/**
 * ProsjektKravTiltakFlowWorkspace - Extended workspace with React Flow visualization
 * 
 * Features:
 * - All existing EntityWorkspace functionality (Cards, Split views)
 * - NEW: Flow visualization showing Emne → ProsjektKrav → ProsjektTiltak relationships
 * - View mode toggle: Cards | Split | Flow
 * - Seamless integration with existing components and data
 */
const ProsjektKravTiltakFlowWorkspace = () => {
  // Custom view mode state (extends EntityWorkspace view modes)
  const [customViewMode, setCustomViewMode] = useState(() => {
    const saved = localStorage.getItem('kombinedWorkspace-viewMode');
    return saved && ['split', 'cards', 'flow'].includes(saved) ? saved : 'split';
  });

  // Create combined adapter and DTO
  const adapter = createProsjektKravTiltakCombinedAdapter({ debug: true });
  const dto = createCombinedEntityDTO(adapter, { debug: true });

  // Get view options state
  const { viewOptions, setViewOptions } = useProsjektKravTiltakCombinedViewStore();

  // Use EntityWorkspace UI hooks (no data hooks - let ProjectFlowView handle its own data)
  const ui = useWorkspaceUI();
  
  // Debug logging
  console.log('FlowWorkspace: customViewMode:', customViewMode);
  console.log('FlowWorkspace: dto:', dto);
  console.log('FlowWorkspace: adapter:', adapter);

  // Handle view mode changes
  const handleViewModeChange = (mode) => {
    setCustomViewMode(mode);
    localStorage.setItem('kombinedWorkspace-viewMode', mode);
    
    // Sync with EntityWorkspace UI store when needed
    if (mode === 'split' || mode === 'cards') {
      ui.setViewMode(mode);
    }
  };

  // Handle entity selection for flow view
  const handleEntitySelect = (entity, action = 'select') => {
    ui.setSelectedEntity(entity);
    
    // For flow view, we might want to center on the selected node
    if (customViewMode === 'flow' && action === 'select') {
      // Flow view specific logic can be added here
    }
  };

  // Create renderer for EntityWorkspace views
  const renderer = createCombinedRenderer({
    entityTypes: { primary: "prosjektkrav", secondary: "prosjekttiltak" },
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
      workspaceType: "prosjektkrav-tiltak-combined",
    },
    viewOptions: {
      showHierarchy: "Vis hierarki",
      showMerknad: "Vis merknader",
      showStatus: "Vis status",
      showVurdering: "Vis vurdering",
      showPrioritet: "Vis prioritet",
      showObligatorisk: "Vis obligatorisk",
      showRelations: "Vis relasjoner",
      showEntityType: "Vis enhetstype",
    },
  });

  // Handle save operations
  const handleSave = async (entityData, isUpdate) => {
    try {
      const result = await dto.save(entityData, isUpdate);
      refetch(); // Refresh data after save
      return result;
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  };

  // Custom header with flow view toggle
  const CustomHeader = () => (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {dto?.getDisplayConfig?.()?.title || "ProsjektKrav og ProsjektTiltak"}
        </h1>
      </div>

      {/* Custom View Mode Toggle with Flow */}
      <div className="flex items-center border rounded-lg p-1 bg-gray-50">
        <Button
          variant={customViewMode === "split" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleViewModeChange("split")}
          className="h-8 w-8 p-0"
          title="Split View"
        >
          <Columns className="w-4 h-4" />
        </Button>
        <Button
          variant={customViewMode === "cards" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleViewModeChange("cards")}
          className="h-8 w-8 p-0"
          title="Cards View"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button
          variant={customViewMode === "flow" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleViewModeChange("flow")}
          className="h-8 w-8 p-0"
          title="Flow View"
        >
          <Network className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <CustomHeader />

      <div className="flex-1" style={{ height: 'calc(100vh - 80px)' }}>
        {customViewMode === 'flow' ? (
          /* Flow View - React Flow visualization */
          <ProjectFlowView
            dto={dto}
            ui={ui}
            onEntitySelect={handleEntitySelect}
            onFieldSave={handleSave}
            selectedEntity={ui.selectedEntity}
            viewOptions={viewOptions}
            className="w-full h-full"
          />
        ) : (
          /* Standard EntityWorkspace for Cards/Split views */
          <EntityWorkspace
            key={`${dto.entityType || "prosjekt-krav-tiltak-combined-workspace"}`}
            dto={dto}
            renderEntityCard={renderer.renderEntityCard}
            renderGroupHeader={renderer.renderGroupHeader}
            renderDetailPane={renderer.renderDetailPane}
            renderSearchBar={renderer.renderSearchBar}
            renderActionButtons={renderer.renderActionButtons}
            renderListHeading={(props) => (
              <RowListHeading
                {...props}
                viewOptions={viewOptions}
                onViewOptionsChange={setViewOptions}
                availableViewOptions={renderer.getAvailableViewOptions()}
              />
            )}
            viewOptions={viewOptions}
            debug={false}
            hideHeader={true} // Hide default header since we show custom one
          />
        )}
      </div>
    </div>
  );
};

export default ProsjektKravTiltakFlowWorkspace;