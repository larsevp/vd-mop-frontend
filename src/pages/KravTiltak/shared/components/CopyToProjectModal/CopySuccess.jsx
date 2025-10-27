import React from 'react';
import { Heading } from '@/components/ui/primitives/heading';

/**
 * CopySuccess - Success summary for completed copy operation
 */
export const CopySuccess = ({ result }) => {
  const { copiedCount, relatedCount, entityType, targetProject } = result;

  const entityLabel = entityType === 'prosjektkrav' ? 'krav' : 'tiltak';
  const entityLabelCapitalized = entityType === 'prosjektkrav' ? 'Krav' : 'Tiltak';
  const relatedLabel = entityType === 'prosjektkrav' ? 'tiltak' : 'krav';
  const relatedLabelCapitalized = entityType === 'prosjektkrav' ? 'Tiltak' : 'Krav';

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <Heading level={3}>Kopiering fullført!</Heading>
        <p className="text-sm text-gray-600 mt-2">
          {entityLabelCapitalized} har blitt kopiert til prosjektet
        </p>
      </div>

      {/* Summary cards matching ImportKravWizard style */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-green-50 text-center">
          <div className="text-sm text-green-700">Kopierte {entityLabel}</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {copiedCount}
          </div>
        </div>

        {relatedCount > 0 && (
          <div className="border rounded-lg p-4 bg-blue-50 text-center">
            <div className="text-sm text-blue-700">Tilhørende {relatedLabel}</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">
              {relatedCount}
            </div>
          </div>
        )}
      </div>

      {/* Target project info */}
      <div className="border-t pt-4">
        <Heading level={4}>Målprosjekt</Heading>
        <div className="mt-2 space-y-1 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Prosjektnavn:</span>
            <span className="font-medium">{targetProject?.navn}</span>
          </div>
          {targetProject?.prosjektnummer && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Prosjektnummer:</span>
              <span className="font-medium">{targetProject?.prosjektnummer}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-gray-600">
        {entityLabelCapitalized} er nå tilgjengelige i målprosjektet og kan redigeres
      </div>
    </div>
  );
};
