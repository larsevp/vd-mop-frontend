import React from 'react';
import { EntityCard } from '../../../shared';

/**
 * ProsjektKravCard - Entity-specific card for ProsjektKrav using shared EntityCard
 */
const ProsjektKravCard = (props) => {
  const config = {
    uidField: 'kravUID',
    badgeText: 'KRAV',
    badgeColor: 'bg-green-100 text-green-700',
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