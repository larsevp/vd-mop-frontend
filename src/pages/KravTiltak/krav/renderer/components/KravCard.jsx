import React from 'react';
import { EntityCard } from '../../../shared';

/**
 * KravCard - Entity-specific card for Krav using shared EntityCard
 */
const KravCard = (props) => {
  const config = {
    uidField: 'kravUID',
    badgeText: 'KRAV',
    badgeColor: 'bg-green-100 text-green-700',
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