import React from "react";
import { EmneGroupHeader, RowListHeading, KravTiltakSearchBar } from "../../shared";
import TiltakCard from "./components/TiltakCard.jsx";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak";

/**
 * TiltakRenderer - Render functions for Tiltak entities
 *
 * This module exports render functions that the EntityWorkspace interface calls
 * to generate the actual JSX for Tiltak entities and groups.
 */

/**
 * Render a single Tiltak entity card
 *
 * @param {Object} entity - The entity data (normalized by adapter)
 * @param {Object} props - Render props from EntityWorkspace
 * @param {Object} dto - The DTO instance for performing updates
 * @param {boolean} props.isSelected - Whether this entity is selected
 * @param {Function} props.onClick - Click handler for entity selection
 * @param {Object} props.viewOptions - Current view options state
 * @returns {JSX.Element} Tiltak card component
 */
export const renderEntityCard = (entity, props, dto) => {
  const { key, onSave, ...restProps } = props;

  // Use the same save handler as detail view - standard edit logic
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

  return <TiltakCard key={key} entity={entity} onFieldSave={handleFieldSave} {...restProps} />;
};

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
export const renderGroupHeader = (groupData, props) => {
  const { key, ...restProps } = props;
  return <EmneGroupHeader key={key || `group-${groupData.group?.emne?.id || "no-emne"}`} groupData={groupData} {...restProps} />;
};

/**
 * Render list heading for Tiltak entities
 */
export const renderListHeading = (props) => {
  return <RowListHeading {...props} entityType="tiltak" />;
};

/**
 * Render Tiltak-specific search bar
 *
 * @param {Object} props - Search props from EntityWorkspace
 * @returns {JSX.Element} KravTiltakSearchBar configured for Tiltak
 */
export const renderSearchBar = (props) => {
  return (
    <KravTiltakSearchBar
      {...props}
      // Tiltak-specific customizations can go here
      customFilterFields={
        [
          // Example: Could add tiltak-specific filters
          // {
          //   key: 'category',
          //   label: 'Kategori',
          //   render: ({ value, onChange }) => (
          //     <Select value={value || 'all'} onValueChange={onChange}>
          //       <SelectTrigger><SelectValue /></SelectTrigger>
          //       <SelectContent>
          //         <SelectItem value="all">Alle kategorier</SelectItem>
          //         {/* Dynamic category options would go here */}
          //       </SelectContent>
          //     </Select>
          //   )
          // }
        ]
      }
    />
  );
};

/**
 * Get available view options for Tiltak
 * This defines what toggles appear in the "Visning" dropdown
 * Only includes options that are enabled in modelConfig ui section
 *
 * @returns {Object} Available view options with labels
 */
export const getAvailableViewOptions = () => {
  const uiConfig = tiltakConfig?.workspace?.ui || {};

  const allOptions = {
    showHierarchy: "Hierarki og relasjoner",
    showMerknader: "Merknader",
    showVurdering: "Vurdering",
    showStatus: "Status",
    showPrioritet: "Prioritet",
    showObligatorisk: "Obligatorisk/Valgfri",
    showRelations: "Tilknyttede relasjoner",
  };

  // Only return options that are not explicitly disabled in modelConfig
  const availableOptions = {};
  Object.keys(allOptions).forEach((key) => {
    if (uiConfig[key] !== false) {
      availableOptions[key] = allOptions[key];
    }
  });

  return availableOptions;
};

/**
 * Get default view options for Tiltak
 * Reads from modelConfig ui section
 *
 * @returns {Object} Default view options state
 */
export const getDefaultViewOptions = () => {
  return (
    tiltakConfig?.workspace?.ui || {
      showHierarchy: true,
      showVurdering: true,
      showStatus: false,
      showPrioritet: true,
      showObligatorisk: true,
      showRelations: true,
    }
  );
};
