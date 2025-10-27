import React from 'react';
import { Heading } from '@/components/ui/primitives/heading';
import { Building2, Copy } from 'lucide-react';

/**
 * CopyPreview - Preview/confirmation before copying
 */
export const CopyPreview = ({ selectedProject, selectedCount, entityLabel, entityLabelPlural }) => {
  return (
    <div className="space-y-6">
      <div>
        <Heading level={3}>Bekreft kopiering</Heading>
        <p className="text-sm text-gray-600 mt-2">
          Sjekk detaljene før du starter kopieringen
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="text-sm text-blue-700">Antall {entityLabelPlural}</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {selectedCount}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-sm text-gray-700">Målprosjekt</div>
          <div className="text-base font-medium text-gray-900 mt-2 truncate">
            {selectedProject?.navn}
          </div>
        </div>
      </div>

      {/* Target project details */}
      <div className="border-t pt-4">
        <Heading level={4}>Målprosjekt detaljer</Heading>
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <Building2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{selectedProject?.navn}</div>
              {selectedProject?.prosjektnummer && (
                <div className="text-sm text-gray-600 mt-0.5">
                  Prosjektnummer: {selectedProject.prosjektnummer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
