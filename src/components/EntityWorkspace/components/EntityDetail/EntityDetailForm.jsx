/**
 * EntityDetailForm - Edit form using displayValues system
 * Integrates with existing RowForm logic and FieldResolver
 */

import React from 'react';
import { FieldResolver } from '@/components/tableComponents/fieldTypes/fieldResolver.jsx';

const EntityDetailForm = ({ 
  entity, 
  formData, 
  validationErrors, 
  entityType, 
  modelConfig,
  onChange 
}) => {
  // Get form fields from config
  const getFormFields = () => {
    const configFields = modelConfig?.formFields || modelConfig?.fields;
    
    if (configFields) {
      return configFields;
    }

    // Default fields by entity type
    switch (entityType) {
      case 'krav':
      case 'prosjektKrav':
        return ['kravUID', 'tittel', 'beskrivelse', 'obligatorisk', 'status', 'emneId'];
      case 'tiltak':
      case 'prosjektTiltak':
        return ['tiltakUID', 'navn', 'beskrivelse', 'status'];
      default:
        return ['navn', 'beskrivelse', 'status'];
    }
  };

  const formFields = getFormFields();

  // Validation error summary
  const renderValidationSummary = () => {
    const errorEntries = Object.entries(validationErrors || {}).filter(([_, error]) => error);
    
    if (errorEntries.length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-red-800 font-medium">Validation Failed</h3>
        </div>
        <ul className="text-red-700 text-sm space-y-1">
          {errorEntries.map(([fieldName, error]) => (
            <li key={fieldName} className="flex items-start">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="entity-detail-form p-6">
      {renderValidationSummary()}

      <div className="space-y-6">
        {formFields.map(fieldName => {
          const value = formData[fieldName];
          const error = validationErrors[fieldName];

          return (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                {/* Add required indicator if field is required */}
                {modelConfig?.validation?.[fieldName]?.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              
              {/* Use FieldResolver for consistent field rendering */}
              <FieldResolver
                fieldName={fieldName}
                value={value}
                entity={formData}
                entityType={entityType}
                mode="edit"
                error={error}
                onChange={(newValue) => onChange(fieldName, newValue)}
                config={modelConfig}
              />
              
              {/* Field-specific error */}
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Use Ctrl+S to save or Escape to cancel editing.
        </p>
      </div>
    </div>
  );
};

export default EntityDetailForm;