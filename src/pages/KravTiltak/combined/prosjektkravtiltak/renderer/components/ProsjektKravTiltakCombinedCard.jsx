import React from 'react';
import { EntityCard } from '../../../../shared';

/**
 * ProsjektKravTiltakCombinedCard - Combined entity card that can render both ProsjektKrav and ProsjektTiltak
 * 
 * Detects entity type and applies appropriate configuration
 */
const ProsjektKravTiltakCombinedCard = (props) => {
  const { entity, ...restProps } = props;
  
  // Detect entity type from the entity data
  const entityType = entity?.entityType?.toLowerCase() || 'unknown';
  
  // Configure based on entity type
  let config;
  
  switch (entityType) {
    case 'prosjektkrav':
      config = {
        uidField: 'kravUID',
        badgeText: 'PROSJEKTKRAV',
        badgeColor: 'bg-blue-100 text-blue-700',
        childrenLabel: 'underkrav',
        relations: [
          {
            field: 'prosjektTiltak',
            label: 'prosjekttiltak',
            prefix: '→',
            color: 'text-green-600'
          },
          {
            field: 'generalKrav',
            label: 'basert på',
            prefix: '⊃',
            color: 'text-gray-600'
          }
        ]
      };
      break;
      
    case 'prosjekttiltak':
      config = {
        uidField: 'tiltakUID',
        badgeText: 'PROSJEKTTILTAK',
        badgeColor: 'bg-green-100 text-green-700',
        childrenLabel: 'undertiltak',
        relations: [
          {
            field: 'prosjektKrav',
            label: 'prosjektkrav',
            prefix: '←',
            color: 'text-blue-600'
          },
          {
            field: 'generalTiltak',
            label: 'basert på',
            prefix: '⊃',
            color: 'text-gray-600'
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

export default ProsjektKravTiltakCombinedCard;