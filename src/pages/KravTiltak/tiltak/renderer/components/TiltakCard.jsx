import React from 'react';
import { EntityCard } from '../../../shared';
import { getEntityTypeConfig } from '../../../shared/utils/entityTypeBadges';

/**
 * TiltakCard - Entity-specific card for Tiltak using shared EntityCard
 */
const TiltakCard = (props) => {
  const entityConfig = getEntityTypeConfig('tiltak');
  
  const config = {
    uidField: 'tiltakUID',
    badgeText: entityConfig.shortLabel,
    badgeColor: entityConfig.badgeColor,
    childrenLabel: 'undertiltak',
    relations: [
      {
        field: 'krav',
        label: 'krav',
        prefix: '←',
        color: 'text-green-600'
      }
    ]
  };

  return <EntityCard {...props} config={config} />;
};

export default TiltakCard;