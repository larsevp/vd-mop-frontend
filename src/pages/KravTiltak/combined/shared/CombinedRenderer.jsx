import React, { useState } from "react";
import { EmneGroupHeader, RowListHeading, EntityDetailPane, KravTiltakSearchBar, KravCreateButton, TiltakCreateButton, ProsjektKravCreateButton, ProsjektTiltakCreateButton } from "../../shared";
import { WordExporter } from "@/components/export/WordExporter";
import { Plus, ChevronDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";

/**
 * Generic Combined Renderer Factory
 * 
 * Creates renderer functions for combined entity workspaces.
 * This eliminates code duplication between KravTiltak and ProsjektKravTiltak combined renderers.
 * 
 * @param {Object} config - Configuration object for the combined renderer
 * @param {Object} config.entityTypes - Entity type configuration
 * @param {string} config.entityTypes.primary - Primary entity type (e.g., 'krav', 'prosjektkrav')  
 * @param {string} config.entityTypes.secondary - Secondary entity type (e.g., 'tiltak', 'prosjekttiltak')
 * @param {Object} config.cardRenderers - Card renderer functions
 * @param {Function} config.cardRenderers.primaryCardRenderer - Primary entity card renderer function
 * @param {Function} config.cardRenderers.secondaryCardRenderer - Secondary entity card renderer function  
 * @param {Object} config.renderers - Detail renderer functions
 * @param {Function} config.renderers.primaryDetailRenderer - Primary entity detail renderer
 * @param {Function} config.renderers.secondaryDetailRenderer - Secondary entity detail renderer
 * @param {Object} config.adapters - Individual entity adapters for proper model config delegation
 * @param {Object} config.adapters.primaryAdapter - Primary entity adapter (e.g., KravAdapter)
 * @param {Object} config.adapters.secondaryAdapter - Secondary entity adapter (e.g., TiltakAdapter)
 * @param {Object} config.labels - Display labels
 * @param {string} config.labels.primaryCreate - Primary create button label (e.g., 'Opprett Krav')
 * @param {string} config.labels.secondaryCreate - Secondary create button label (e.g., 'Opprett Tiltak')
 * @param {string} config.labels.primaryCount - Primary count label (e.g., 'krav')
 * @param {string} config.labels.secondaryCount - Secondary count label (e.g., 'tiltak')
 * @param {string} config.labels.workspaceType - Workspace type for EntityDetailPane fallback
 * @param {Object} config.viewOptions - Available view options
 */
export const createCombinedRenderer = (config) => {
  const {
    entityTypes: { primary: primaryType, secondary: secondaryType },
    cardRenderers: { primaryCardRenderer, secondaryCardRenderer },
    renderers: { primaryDetailRenderer, secondaryDetailRenderer },
    labels: { primaryCreate, secondaryCreate, primaryCount: primaryCountLabel, secondaryCount: secondaryCountLabel, workspaceType },
    viewOptions,
    adapters: { primaryAdapter, secondaryAdapter } = {} // Add adapters to get proper model configs
  } = config;

  /**
   * Render a single combined entity card
   * Uses the appropriate single entity renderer function based on entity type
   */
  const renderEntityCard = (entity, props, dto) => {
    const entityType = entity?.entityType?.toLowerCase();
    const primaryTypeLower = primaryType.toLowerCase();
    const secondaryTypeLower = secondaryType.toLowerCase();

    // Use the appropriate single entity renderer function (case-insensitive comparison)
    if (entityType === primaryTypeLower) {
      return primaryCardRenderer(entity, props, dto);
    } else if (entityType === secondaryTypeLower) {
      return secondaryCardRenderer(entity, props, dto);
    }

    // Fallback to primary renderer for unknown types
    return primaryCardRenderer(entity, props, dto);
  };

  /**
   * Render emne group header for combined entities
   * Shows count of both entity types
   */
  const renderGroupHeader = (groupData, options = {}) => {
    // Calculate counts by entity type
    const items = groupData.items || [];
    const primaryTypeLower = primaryType.toLowerCase();
    const secondaryTypeLower = secondaryType.toLowerCase();
    const primaryCount = items.filter((item) => item.entityType?.toLowerCase() === primaryTypeLower).length;
    const secondaryCount = items.filter((item) => item.entityType?.toLowerCase() === secondaryTypeLower).length;

    // Create enhanced group data with type counts
    const enhancedGroupData = {
      ...groupData,
      _typeCounts: {
        [primaryType]: primaryCount,
        [secondaryType]: secondaryCount,
        total: items.length,
      },
    };

    return (
      <EmneGroupHeader
        groupData={enhancedGroupData}
        itemCount={items.length}
        entityType={`${primaryType}-${secondaryType}-combined`}
        subtitle={`${primaryCount} ${primaryCount === 1 ? primaryCountLabel.slice(0, -1) : primaryCountLabel}, ${secondaryCount} ${secondaryCount === 1 ? secondaryCountLabel.slice(0, -1) : secondaryCountLabel}`}
        {...options}
      />
    );
  };

  /**
   * Render list heading for combined entities
   */
  const renderListHeading = (props) => {
    return (
      <RowListHeading
        {...props}
        entityType={`${primaryType}-${secondaryType}-combined`}
      />
    );
  };

  /**
   * Render combined search bar
   */
  const renderSearchBar = (props) => {
    return (
      <KravTiltakSearchBar
        {...props}
        // Combined view-specific customizations can go here
        customFilterFields={[]}
      />
    );
  };

  /**
   * Render action buttons for combined entities
   * Shows separate create buttons that delegate to individual model configs
   * Responsive: collapses into dropdown menu on narrow screens
   */
  const renderActionButtons = ({ handleCreateNew, currentFilters }) => {
    // Select appropriate button components based on entity types
    const buttonMap = {
      'krav': KravCreateButton,
      'tiltak': TiltakCreateButton,
      'prosjektkrav': ProsjektKravCreateButton,
      'prosjekttiltak': ProsjektTiltakCreateButton,
    };

    const PrimaryButtonComponent = buttonMap[primaryType.toLowerCase()] || KravCreateButton;
    const SecondaryButtonComponent = buttonMap[secondaryType.toLowerCase()] || TiltakCreateButton;

    // Responsive action buttons component with dropdown for narrow screens
    const ResponsiveActionButtons = () => {
      const [isOpen, setIsOpen] = useState(false);
      const menuRef = React.useRef(null);

      // Close dropdown when clicking outside
      React.useEffect(() => {
        const handleClickOutside = (event) => {
          if (menuRef.current && !menuRef.current.contains(event.target)) {
            setIsOpen(false);
          }
        };

        if (isOpen) {
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
        }
      }, [isOpen]);

      return (
        <>
          {/* Desktop: Show all buttons (xl screens and above) */}
          <div className="hidden xl:flex gap-3">
            <PrimaryButtonComponent
              onClick={() => handleCreateNew(primaryType)}
              label={primaryCreate}
            />
            <SecondaryButtonComponent
              onClick={() => handleCreateNew(secondaryType)}
              label={secondaryCreate}
            />
            <WordExporter
              currentFilters={currentFilters}
              variant="outline"
              size="default"
            />
          </div>

          {/* Mobile/Tablet: Dropdown menu (below xl) */}
          <div className="xl:hidden relative" ref={menuRef}>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ny
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu">
                  <button
                    onClick={() => {
                      handleCreateNew(primaryType);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors flex items-center"
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2 text-emerald-600" />
                    {primaryCreate}
                  </button>
                  <button
                    onClick={() => {
                      handleCreateNew(secondaryType);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 transition-colors flex items-center"
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2 text-sky-600" />
                    {secondaryCreate}
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  {/* Word Export - wrapped in menu item style */}
                  <div className="px-0">
                    <WordExporter
                      currentFilters={currentFilters}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:bg-gray-50 h-auto py-2.5 px-4 rounded-none font-normal text-sm"
                      showIcon={true}
                      buttonText="Eksporter til Word"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      );
    };

    return <ResponsiveActionButtons />;
  };

  /**
   * Render detail pane for combined entities
   * Delegates to appropriate entity-specific renderer
   */
  const renderDetailPane = (selectedEntity, props) => {
    // Safely handle props that might be null or undefined
    const { onSave, onDelete, onClose, ...restProps } = props || {};

    if (!selectedEntity) {
      return (
        <EntityDetailPane
          entity={null}
          onSave={onSave}
          onDelete={onDelete}
          onClose={onClose}
          entityType={workspaceType}
          {...restProps}
        />
      );
    }

    // Entity type should be set by the adapter's enhanceEntity() method
    // For new entities, use __entityType, for existing entities use entityType (both should be strings)
    const entityType = selectedEntity.__entityType || selectedEntity.entityType;
    const entityTypeLower = entityType?.toLowerCase();
    const primaryTypeLower = primaryType.toLowerCase();
    const secondaryTypeLower = secondaryType.toLowerCase();

    // Delegate to the appropriate entity-specific renderer
    // Pass through the save/delete handlers from EntityWorkspace (via combined DTO)
    // Also pass workspaceType so individual renderers know they're in a combined workspace
    const rendererProps = { ...props, workspaceType } || {};

    if (entityTypeLower === primaryTypeLower) {
      return primaryDetailRenderer(selectedEntity, rendererProps);
    } else if (entityTypeLower === secondaryTypeLower) {
      return secondaryDetailRenderer(selectedEntity, rendererProps);
    }

    // If we reach here, entity type doesn't match this workspace's expected types
    // This can happen during workspace transitions when selecting entities from different workspaces
    console.info('CombinedRenderer: Entity type mismatch - falling back to generic renderer. This is normal during workspace transitions.', {
      entity: selectedEntity,
      entityType,
      expectedTypes: [primaryType, secondaryType]
    });

    // Fallback to generic detail pane
    return (
      <EntityDetailPane
        entity={selectedEntity}
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
        entityType={workspaceType}
        {...restProps}
      />
    );
  };

  /**
   * Get available view options for combined entities
   */
  const getAvailableViewOptions = () => {
    return viewOptions || {
      showHierarchy: "Vis hierarki",
      showMerknad: "Vis merknader",
      showStatus: "Vis status", 
      showVurdering: "Vis vurdering",
      showPrioritet: "Vis prioritet",
      showObligatorisk: "Vis obligatorisk",
      showRelations: "Vis relasjoner",
      showEntityType: "Vis enhetstype",
    };
  };

  return {
    renderEntityCard,
    renderGroupHeader,
    renderListHeading,
    renderSearchBar,
    renderActionButtons,
    renderDetailPane,
    getAvailableViewOptions,
  };
};