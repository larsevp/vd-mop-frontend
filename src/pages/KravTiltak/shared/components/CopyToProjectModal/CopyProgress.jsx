import React from 'react';
import { Heading } from '@/components/ui/primitives/heading';

/**
 * CopyProgress - Progress indicator for copy operation
 */
export const CopyProgress = ({ progress, entityLabel }) => {
  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
        <Heading level={3}>Kopierer {entityLabel}...</Heading>
        <p className="text-sm text-gray-600 mt-2">
          Vennligst vent mens {entityLabel} kopieres til det andre prosjektet
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-sky-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="text-center text-sm text-gray-600">
        {progress}% fullført
      </div>
    </div>
  );
};
