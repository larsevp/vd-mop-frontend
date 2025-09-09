import React from 'react';
import { EntityCard } from '../../../shared';

/**
 * ProsjektTiltakCard - Entity-specific card for ProsjektTiltak using shared EntityCard
 */
const ProsjektTiltakCard = (props) => {
  const config = {
    uidField: 'tiltakUID',
    badgeText: 'P-TILTAK',
    badgeColor: 'bg-blue-100 text-blue-700',
    childrenLabel: 'undertiltak',
    specialReference: {
      field: 'generalTiltak',
      viewOption: 'showGeneralTiltak'
    },
    relations: [
      {
        field: 'prosjektKrav',
        label: 'krav',
        prefix: '←',
        color: 'text-blue-600'
      }
    ]
  };

  return <EntityCard {...props} config={config} />;
};

export default ProsjektTiltakCard;