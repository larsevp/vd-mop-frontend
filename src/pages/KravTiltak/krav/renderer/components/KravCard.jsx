import React from 'react';
import { EntityCard } from '../../../shared';
import { getEntityTypeConfig } from '../../../shared/utils/entityTypeBadges';

/**
 * KravCard - Entity-specific card for Krav using shared EntityCard
 */
const KravCard = (props) => {
  const entityConfig = getEntityTypeConfig('krav');
  
  const config = {
    uidField: 'kravUID',
    badgeText: entityConfig.shortLabel,
    badgeColor: entityConfig.badgeColor,
    childrenLabel: 'underkrav',
    relations: [
      {
        field: 'tiltak',
        label: 'tiltak',
        prefix: '→',
        color: 'text-blue-600'
      }
    ]
  };

  return <EntityCard {...props} config={config} />;
};

export default KravCard;