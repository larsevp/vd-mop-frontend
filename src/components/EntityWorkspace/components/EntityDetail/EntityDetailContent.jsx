/**
 * EntityDetailContent - Read-only content display
 * Uses DisplayValueResolver for consistent field rendering
 */

import React from 'react';
import { DisplayValueResolver } from '@/components/tableComponents/displayValues/DisplayValueResolver.jsx';

const EntityDetailContent = ({ entity, entityType, modelConfig, workspaceConfig }) => {
  // Get fields to display based on config
  const getDisplayFields = () => {
    // Use detailFields from config if available, otherwise fall back to common fields
    const configFields = modelConfig?.detailFields || modelConfig?.fields;
    
    if (configFields) {
      return configFields;
    }

    // Default fields by entity type
    switch (entityType) {
      case 'krav':
      case 'prosjektKrav':
        return ['kravUID', 'tittel', 'beskrivelse', 'obligatorisk', 'status', 'emne', 'merknad'];
      case 'tiltak':
      case 'prosjektTiltak':
        return ['tiltakUID', 'navn', 'beskrivelse', 'status', 'merknad'];
      default:
        return ['navn', 'beskrivelse', 'status'];
    }
  };

  const displayFields = getDisplayFields();

  // Group fields into sections for better organization
  const groupFields = (fields) => {
    return [
      {
        title: 'General Information',
        fields: fields.filter(field => 
          ['kravUID', 'tiltakUID', 'navn', 'tittel', 'beskrivelse'].includes(field)
        )
      },
      {
        title: 'Details',
        fields: fields.filter(field => 
          ['obligatorisk', 'status', 'emne', 'prioritet', 'vurdering'].includes(field)
        )
      },
      {
        title: 'Additional Information', 
        fields: fields.filter(field => 
          ['merknad', 'informasjon', 'createdAt', 'updatedAt'].includes(field)
        )
      }
    ].filter(section => section.fields.length > 0);
  };

  const sections = groupFields(displayFields);

  return (
    <div className="entity-detail-content p-6 space-y-8">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {section.title}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map(fieldName => {
              const value = entity[fieldName];
              
              // Skip empty fields in read-only view
              if (value == null || value === '') {
                return null;
              }

              return (
                <div key={fieldName} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  
                  <div className="text-sm text-gray-900 bg-gray-50 rounded-md p-3 min-h-[2.5rem] flex items-start">
                    <DisplayValueResolver
                      value={value}
                      fieldName={fieldName}
                      entityType={entityType}
                      entity={entity}
                      mode="display"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Show message if no content */}
      {sections.every(section => section.fields.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4 opacity-20">📄</div>
          <p>No content to display</p>
        </div>
      )}
    </div>
  );
};

export default EntityDetailContent;