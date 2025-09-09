import React from 'react';
import { EntityCard } from '../../../shared';

/**
 * TiltakCard - Entity-specific card for Tiltak using shared EntityCard
 */
const TiltakCard = (props) => {
  const config = {
    uidField: 'tiltakUID',
    badgeText: 'TILTAK',
    badgeColor: 'bg-blue-100 text-blue-700',
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