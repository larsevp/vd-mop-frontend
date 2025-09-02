import React from "react";
import GenericEntityListRow from "../../../../interface/components/GenericEntityListRow.jsx";
import { createGenericEntityComponents } from "../../../../interface/utils/EntityInterface.js";

/**
 * Refactored KravTiltak EntityListRow using Interface Components
 * 
 * This demonstrates how to use the generic interface components
 * while maintaining kravTiltak-specific customizations.
 */
const EntityListRowRefactored = ({
  entity,
  modelConfig,
  entityType,
  isSelected,
  isFocused,
  onClick,
  onFocus,
  renderIcon,
  viewOptions = {},
}) => {
  // Create entity interface for kravTiltak
  const { createListRowProps } = createGenericEntityComponents(entityType, {
    config: { modelConfig }
  });

  // Build interface-compliant props
  const interfaceProps = createListRowProps(entity, {
    display: {
      isSelected,
      isFocused,
      viewOptions
    },
    actions: {
      onClick,
      onFocus
    }
  });

  // Add kravTiltak-specific customizations
  const kravTiltakRenderIcon = renderIcon || ((entity) => {
    // KravTiltak-specific icon logic
    const entityType = entity.entityType || 'krav';
    const iconClass = {
      'krav': '📋',
      'tiltak': '🔧', 
      'prosjektKrav': '📊',
      'prosjektTiltak': '⚙️'
    }[entityType] || '📄';
    
    return <span className="text-lg mr-2">{iconClass}</span>;
  });

  return (
    <GenericEntityListRow
      {...interfaceProps}
      renderIcon={kravTiltakRenderIcon}
    />
  );
};

export default EntityListRowRefactored;