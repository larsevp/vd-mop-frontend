import React from "react";
import { EmneGroupHeader, RowListHeading, KravTiltakSearchBar, KravCreateButton, TiltakCreateButton, ProsjektKravCreateButton, ProsjektTiltakCreateButton } from "../index";

/**
 * Generic renderer factory for KravTiltak entity types
 *
 * Eliminates 95% code duplication across krav/tiltak/prosjektkrav/prosjekttiltak renderers
 * by providing a configurable factory that generates all render functions.
 *
 * This pattern is based on the successful createCombinedRenderer() used in combined views.
 *
 * @param {Object} config - Configuration for the renderer
 * @param {string} config.entityType - Entity type name ('krav', 'tiltak', 'prosjektkrav', 'prosjekttiltak')
 * @param {React.Component} config.CardComponent - The card component to render (KravCard, TiltakCard, etc.)
 * @param {Object} config.modelConfig - The model configuration object from modelConfigs
 * @param {string} config.createLabel - Label for "create new" button (e.g. 'Opprett krav')
 *
 * @returns {Object} Render functions for EntityWorkspace
 *
 * @example
 * // In KravRenderer.jsx
 * import { createKravTiltakRenderer } from "../../shared/renderers/createKravTiltakRenderer";
 * import KravCard from "./components/KravCard.jsx";
 * import { krav as kravConfig } from "@/modelConfigs/models/krav";
 *
 * export const {
 *   renderEntityCard,
 *   renderGroupHeader,
 *   renderListHeading,
 *   renderSearchBar,
 *   getAvailableViewOptions,
 *   getDefaultViewOptions,
 * } = createKravTiltakRenderer({
 *   entityType: 'krav',
 *   CardComponent: KravCard,
 *   modelConfig: kravConfig,
 *   createLabel: 'Opprett krav',
 * });
 */
export const createKravTiltakRenderer = (config) => {
  const {
    entityType,
    CardComponent,
    modelConfig,
    createLabel = 'Opprett',
  } = config;

  return {
    /**
     * Render a single entity card
     *
     * @param {Object} entity - The entity data (normalized by adapter)
     * @param {Object} props - Render props from EntityWorkspace
     * @param {Object} dto - The DTO instance for performing updates
     * @param {boolean} props.isSelected - Whether this entity is selected
     * @param {Function} props.onClick - Click handler for entity selection
     * @param {Object} props.viewOptions - Current view options state
     * @returns {JSX.Element} Entity card component
     */
    renderEntityCard: (entity, props, dto) => {
      const { key, onSave, ...restProps } = props;

      // Generic save handler - standard edit logic for all entity types
      const handleFieldSave = async (fieldName, newValue, entity) => {
        try {
          // Extract the actual value (field components might return objects)
          let actualValue = newValue;
          if (typeof newValue === "object" && newValue !== null) {
            actualValue = newValue.value ?? newValue.id ?? newValue;
          }

          // Create minimal update object - only include id and the changed field
          // This matches the approach used by the detail view
          // Include entityType for combined views that need to route saves
          const saveData = {
            id: entity.id,
            entityType: entity.entityType, // Required for combined adapters to route correctly
            [fieldName]: actualValue,
          };

          // Use the same onSave handler that detail view uses
          if (onSave) {
            await onSave(saveData, true); // true = isUpdate
          } else {
            // Fallback to DTO if no onSave provided
            await dto.save(saveData, true);
          }
        } catch (error) {
          console.error("Failed to save entity:", error);
        }
      };

      // Note: CardComponent wraps EntityCard which gets modelConfig internally via getModelConfig()
      // Don't pass modelConfig as prop - it's not used and may cause issues
      return (
        <CardComponent
          key={key}
          entity={entity}
          onFieldSave={handleFieldSave}
          {...restProps}
        />
      );
    },

    /**
     * Render an emne group header
     *
     * @param {Object} groupData - The group data with emne information
     * @param {Object} props - Render props from EntityWorkspace
     * @param {boolean} props.isCollapsed - Whether this group is collapsed
     * @param {Function} props.onToggle - Toggle handler for group collapse
     * @param {number} props.itemCount - Number of items in this group
     * @returns {JSX.Element} EmneGroupHeader component (shared)
     */
    renderGroupHeader: (groupData, props) => {
      const { key, ...restProps } = props;
      return (
        <EmneGroupHeader
          key={key || `group-${groupData.group?.emne?.id || "no-emne"}`}
          groupData={groupData}
          {...restProps}
        />
      );
    },

    /**
     * Render list heading for entity type
     *
     * @param {Object} props - Heading props from EntityWorkspace
     * @returns {JSX.Element} RowListHeading component
     */
    renderListHeading: (props) => {
      return <RowListHeading {...props} entityType={entityType} />;
    },

    /**
     * Render entity-specific search bar
     *
     * @param {Object} props - Search props from EntityWorkspace
     * @returns {JSX.Element} KravTiltakSearchBar configured for entity type
     */
    renderSearchBar: (props) => {
      return (
        <KravTiltakSearchBar
          {...props}
          // Entity-specific customizations can be added here if needed
          customFilterFields={[]}
        />
      );
    },

    /**
     * Get available view options for this entity type
     * This defines what toggles appear in the "Visning" dropdown
     * Only includes options that are enabled in modelConfig ui section
     *
     * @returns {Object} Available view options with labels
     */
    getAvailableViewOptions: () => {
      const uiConfig = modelConfig?.workspace?.ui || {};

      const allOptions = {
        showHierarchy: "Hierarki og relasjoner",
        showMerknader: "Merknader",
        showVurdering: "Vurdering",
        showStatus: "Status",
        showPrioritet: "Prioritet",
        showObligatorisk: "Obligatorisk/Valgfri",
        showRelations: "Tilknyttede relasjoner",
        showFavorites: "Favoritter", // Tiltak-specific, but included in common set
      };

      // Only return options that are not explicitly disabled in modelConfig
      const availableOptions = {};
      Object.keys(allOptions).forEach((key) => {
        if (uiConfig[key] !== false) {
          availableOptions[key] = allOptions[key];
        }
      });

      return availableOptions;
    },

    /**
     * Get default view options for this entity type
     * Reads from modelConfig ui section
     *
     * @returns {Object} Default view options state
     */
    getDefaultViewOptions: () => {
      return (
        modelConfig?.workspace?.ui || {
          showHierarchy: true,
          showVurdering: true,
          showStatus: false,
          showPrioritet: true,
          showObligatorisk: true,
          showRelations: true,
        }
      );
    },

    /**
     * Render action buttons (create new entity button)
     *
     * @param {Object} props - Action button props
     * @param {Function} props.handleCreateNew - Function to create new entity
     * @returns {JSX.Element} Action buttons
     */
    renderActionButtons: ({ handleCreateNew }) => {
      // Select appropriate button component based on entity type
      const buttonMap = {
        'krav': KravCreateButton,
        'tiltak': TiltakCreateButton,
        'prosjektkrav': ProsjektKravCreateButton,
        'prosjekttiltak': ProsjektTiltakCreateButton,
      };

      const ButtonComponent = buttonMap[entityType.toLowerCase()] || KravCreateButton;

      return (
        <ButtonComponent
          onClick={() => handleCreateNew(entityType)}
          label={createLabel}
        />
      );
    },
  };
};
