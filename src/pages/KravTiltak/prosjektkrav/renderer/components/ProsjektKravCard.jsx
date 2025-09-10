import React from 'react';
import { EntityCard } from '../../../shared';
import { getEntityTypeConfig } from '../../../shared/utils/entityTypeBadges';

/**
 * ProsjektKravCard - Entity-specific card for ProsjektKrav using shared EntityCard
 */
const ProsjektKravCard = (props) => {
  const entityConfig = getEntityTypeConfig('prosjektkrav');
  
  const config = {
    uidField: 'kravUID',
    badgeText: entityConfig.shortLabel,
    badgeColor: entityConfig.badgeColor,
    childrenLabel: 'underkrav',
    relations: [
      {
        field: 'prosjektTiltak',
        label: 'tiltak',
        prefix: '→',
        color: 'text-blue-600'
      }
    ]
  };

  return <EntityCard {...props} config={config} />;
};

export default ProsjektKravCard;