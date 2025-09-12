import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FlowWorkspace from '../flow/workspace/FlowWorkspace';
import { createSingleEntityDTO } from '@/components/EntityWorkspace/interface/data';
import { createProsjektTiltakAdapter } from './adapter';
import { renderSearchBar, renderDetailPane } from './renderer';
import { prosjektTiltak as prosjektTiltakConfig } from '@/modelConfigs/models/prosjektTiltak';
import { useProjectStore } from '@/stores/userStore';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building } from 'lucide-react';

/**
 * ProsjektTiltakFlowWorkspace - Flow visualization for ProsjektTiltak entities
 * 
 * This component creates a React Flow visualization specifically for ProsjektTiltak
 * entities, following the same patterns established in the combined KravTiltak flow.
 * 
 * Features:
 * - Project-scoped ProsjektTiltak entities
 * - Emne grouping and hierarchy visualization  
 * - Interactive nodes with double-click detail view
 * - Search and filtering capabilities
 * - Automatic cache invalidation on save/delete operations
 */
const ProsjektTiltakFlowWorkspace = ({ onFlowToggle: providedOnFlowToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject } = useProjectStore();

  // Show message if no project is selected
  if (!currentProject) {
    return (
      <div className="bg-background-primary min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
              <Building className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Ingen prosjekt valgt</h3>
              <p className="text-yellow-700 mb-4">Du må velge et prosjekt for å se flow-visualisering av tiltak.</p>
              <Link to="/" className="inline-flex items-center text-yellow-800 hover:text-yellow-900 font-medium">
                <ArrowLeft size={16} className="mr-2" />
                Gå til prosjektliste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create dynamic config with current project info
  const dynamicConfig = useMemo(() => ({
    ...prosjektTiltakConfig,
    title: `${currentProject.navn} - Tiltak Flow`,
    desc: `Flow-visualisering av tiltak for prosjekt: ${currentProject.prosjektnummer || currentProject.navn}`,
  }), [currentProject]);

  // Create ProsjektTiltak adapter following established pattern
  const adapter = useMemo(() => createProsjektTiltakAdapter(dynamicConfig), [dynamicConfig]);
  
  // Wrap adapter in SingleEntityDTO for unified interface
  const dto = useMemo(() => createSingleEntityDTO(adapter), [adapter]);

  // Transform single entity data to flow-compatible format
  // FlowWorkspace expects CombinedEntityDTO format, so we need to transform
  const transformSingleEntityToFlowFormat = (singleEntityData) => {
    if (!singleEntityData) {
      return { items: [], groups: [] };
    }

    // SingleEntityDTO returns { items, total, page, pageSize, hasMore }
    // Transform to format expected by FlowWorkspace data transformation
    return {
      isGrouped: true,
      items: singleEntityData.groups || singleEntityData.items || [],
      total: singleEntityData.total || 0,
      page: singleEntityData.page || 1,
      pageSize: singleEntityData.pageSize || 100,
      hasMore: singleEntityData.hasMore || false
    };
  };

  // Create a flow adapter that works with SingleEntityDTO
  const flowAdapter = useMemo(() => ({
    getSupportedEntityTypes: () => ["prosjekttiltak"],
    // Transform SingleEntityDTO data to flow format in the component
  }), []);

  // Handle flow toggle navigation back to regular workspace while preserving state
  const handleFlowToggle = providedOnFlowToggle || (() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/prosjekt-tiltak-flow-workspace')) {
      const regularPath = currentPath.replace('/prosjekt-tiltak-flow-workspace', '/prosjekt-tiltak-workspace');
      navigate(regularPath, { state: location.state });
    } else if (currentPath.includes('/prosjekt-tiltak-flow')) {
      const regularPath = currentPath.replace('/prosjekt-tiltak-flow', '/prosjekt-tiltak-workspace');
      navigate(regularPath, { state: location.state });
    }
  });

  return (
    <FlowWorkspace
      key={`prosjekttiltak-flow-${currentProject?.id || "no-project"}`}
      singleEntityDTO={dto}
      transformData={transformSingleEntityToFlowFormat}
      renderSearchBar={renderSearchBar}
      onFlowToggle={handleFlowToggle}
      className="prosjekttiltak-flow-workspace"
      viewOptions={{
        showHierarchy: true,
        showRelations: true,
        entityScope: 'prosjekttiltak' // Flow will only show tiltak entities
      }}
      singleEntityDetailRenderer={renderDetailPane}
    />
  );
};

export default ProsjektTiltakFlowWorkspace;