import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createProsjektKravTiltakCombinedAdapter } from "./adapter";
import { createCombinedRenderer } from "../shared/CombinedRenderer";
import { useProsjektKravTiltakCombinedViewStore } from "./store";
import { RowListHeading } from "../../shared";
import FlowWorkspace from "../../flow/workspace/FlowWorkspace";

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
 * Reuses shared components:
 * - RowListHeading for search, filters, and view toggles (extended with Flow option)
 * - CombinedRenderer for card/detail rendering
 * - Same adapters and DTOs as regular combined workspace
 * 
 * Features:
 * - All existing EntityWorkspace functionality (Cards, Split views)
 * - NEW: Flow visualization showing Emne → ProsjektKrav → ProsjektTiltak relationships
 * - View mode toggle: Cards | Split | Flow
 */
const ProsjektKravTiltakFlowWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Flow view mode state - default to 'flow' since this is the Flow workspace
  const [flowViewMode, setFlowViewMode] = useState('flow');

  // Create combined adapter and DTO
  const adapter = createProsjektKravTiltakCombinedAdapter({ debug: true });
  const dto = createCombinedEntityDTO(adapter, { debug: true });

  // Get view options state (reuse existing store)
  const { viewOptions, setViewOptions } = useProsjektKravTiltakCombinedViewStore();

  // Handle flow view toggle - navigate back to regular workspace while preserving state
  const handleFlowToggle = () => {
    // Navigate back to regular combined workspace
    const currentPath = window.location.pathname;
    if (currentPath.includes('/prosjekt-krav-tiltak-flow')) {
      const regularPath = currentPath.replace('/prosjekt-krav-tiltak-flow', '/prosjekt-krav-tiltak-combined');
      // Preserve the location state (including returnTo)
      navigate(regularPath, { state: location.state });
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
      showEntityType: "Vis enhetstype",
      showUID: "Vis ID",
    },
  });

  // Enhanced RowListHeading that includes Flow toggle
  const EnhancedRowListHeading = (props) => (
    <RowListHeading
      {...props}
      viewOptions={viewOptions}
      onViewOptionsChange={setViewOptions}
      availableViewOptions={renderer.getAvailableViewOptions()}
      // Pass flow state and handler
      flowViewMode={flowViewMode}
      onFlowToggle={handleFlowToggle}
    />
  );

  return flowViewMode === 'flow' ? (
    /* Flow View - React Flow visualization */
    <FlowWorkspace
      viewOptions={viewOptions}
      className="w-full h-full"
      renderSearchBar={renderer.renderSearchBar}
      onFlowToggle={handleFlowToggle}
    />
  ) : (
    /* Standard EntityWorkspace for Cards/Split views with enhanced heading */
    <EntityWorkspace
      key={`${dto.entityType || "prosjekt-krav-tiltak-combined-workspace"}`}
      dto={dto}
      renderEntityCard={renderer.renderEntityCard}
      renderGroupHeader={renderer.renderGroupHeader}
      renderDetailPane={renderer.renderDetailPane}
      renderSearchBar={renderer.renderSearchBar}
      renderActionButtons={renderer.renderActionButtons}
      renderListHeading={EnhancedRowListHeading}
      viewOptions={viewOptions}
      debug={false}
    />
  );
};

export default ProsjektKravTiltakFlowWorkspace;