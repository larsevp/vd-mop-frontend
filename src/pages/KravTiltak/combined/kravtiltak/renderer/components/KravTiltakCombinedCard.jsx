import React from 'react';
import { EntityCard } from '../../../../shared';

/**
 * KravTiltakCombinedCard - Combined entity card that can render both Krav and Tiltak
 * 
 * Detects entity type and applies appropriate configuration
 */
const KravTiltakCombinedCard = (props) => {
  const { entity, ...restProps } = props;
  
  // Detect entity type from the entity data
  const entityType = entity?.entityType?.toLowerCase() || 'unknown';
  
  // Configure based on entity type
  let config;
  
  switch (entityType) {
    case 'krav':
      config = {
        uidField: 'kravUID',
        badgeText: 'Krav',
        badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        childrenLabel: 'underkrav',
        relations: [
          {
            field: 'tiltak',
            label: 'tiltak',
            prefix: '→',
            color: 'text-sky-600'
          }
        ]
      };
      break;

    case 'tiltak':
      config = {
        uidField: 'tiltakUID',
        badgeText: 'Tiltak',
        badgeColor: 'bg-sky-100 text-sky-800 border border-sky-200',
        childrenLabel: 'undertiltak',
        relations: [
          {
            field: 'krav',
            label: 'krav',
            prefix: '←',
            color: 'text-emerald-600'
          }
        ]
      };
      break;
      
    default:
      // Fallback configuration for unknown types
      config = {
        uidField: 'uid',
        badgeText: entityType?.toUpperCase() || 'UNKNOWN',
        badgeColor: 'bg-gray-100 text-gray-700',
        childrenLabel: 'underordnede',
        relations: []
      };
  }

  return <EntityCard entity={entity} config={config} {...restProps} />;
};

export default KravTiltakCombinedCard;