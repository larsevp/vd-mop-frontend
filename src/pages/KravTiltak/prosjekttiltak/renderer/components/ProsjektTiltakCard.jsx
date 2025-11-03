import React from 'react';
import { EntityCard } from '../../../shared';
import { getEntityTypeConfig } from '../../../shared/utils/entityTypeBadges';
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";

/**
 * ProsjektTiltakCard - Entity-specific card for ProsjektTiltak using shared EntityCard
 */
const ProsjektTiltakCard = (props) => {
  const entityConfig = getEntityTypeConfig('prosjekttiltak');

  const config = {
    uidField: 'tiltakUID',
    badgeText: 'Tiltak', // Keep as "Tiltak" as requested by user
    badgeColor: entityConfig.badgeColor,
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

  return <EntityCard {...props} config={config} modelConfig={prosjektTiltakConfig} />;
};

export default ProsjektTiltakCard;