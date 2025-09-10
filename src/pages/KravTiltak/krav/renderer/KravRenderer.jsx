import React from "react";
import KravCard from "./components/KravCard.jsx";
import { EmneGroupHeader, RowListHeading, EntityDetailPane, KravTiltakSearchBar } from "../../shared";

/**
 * Krav-specific renderer functions
 *
 * These functions provide domain-specific rendering for Krav entities
 * while maintaining consistency with the EntityWorkspace pattern.
 */

/**
 * Render a single Krav entity card
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

  return <KravCard key={key} entity={entity} onFieldSave={handleFieldSave} {...restProps} />;
};

/**
 * Render emne group header for Krav entities
 */
export const renderGroupHeader = (groupData, options = {}) => {
  return <EmneGroupHeader groupData={groupData} itemCount={groupData.items?.length || 0} entityType="krav" {...options} />;
};

/**
 * Render list heading for Krav entities
 */
export const renderListHeading = (props) => {
  return <RowListHeading {...props} entityType="krav" />;
};

/**
 * Render Krav-specific search bar
 *
 * @param {Object} props - Search props from EntityWorkspace
 * @returns {JSX.Element} KravTiltakSearchBar configured for Krav
 */
export const renderSearchBar = (props) => {
  return (
    <KravTiltakSearchBar
      {...props}
      // Krav-specific customizations can go here
      customFilterFields={
        [
          // Example: Could add general krav-specific filters like
          // regulatory category, complexity level, etc.
        ]
      }
    />
  );
};

/**
 * Get available view options for Krav
 */
export const getAvailableViewOptions = () => {
  return {
    showHierarchy: "Vis hierarki",
    showMerknad: "Vis merknader",
    showStatus: "Vis status",
    showVurdering: "Vis vurdering",
    showPrioritet: "Vis prioritet",
    showObligatorisk: "Vis obligatorisk",
    showRelations: "Vis relasjoner",
  };
};
