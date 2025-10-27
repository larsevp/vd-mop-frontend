import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/primitives/button';
import { Heading } from '@/components/ui/primitives/heading';
import { Separator } from '@/components/ui/primitives/separator';
import { useProjectStore } from '@/stores/userStore';
import { ProjectSelector } from './ProjectSelector';
import { CopyProgress } from './CopyProgress';
import { Building2, CheckCircle2 } from 'lucide-react';

/**
 * CombinedCopyModal - Multi-step wizard for copying mixed ProsjektKrav and ProsjektTiltak entities
 *
 * Steps:
 * 1. Select target project
 * 2. Preview and confirm
 * 3. Progress indicator during copy
 * 4. Success summary
 */
export const CombinedCopyModal = ({
  open,
  onClose,
  selectedEntities = new Map(), // Map with metadata { id, entityType, ... }
  copyFunctions, // { prosjektKrav: fn, prosjektTiltak: fn }
  onCopyComplete,
}) => {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [copyProgress, setCopyProgress] = useState(0);
  const [copyResult, setCopyResult] = useState(null);

  // Separate entities by type
  const separateEntitiesByType = () => {
    const kravIds = [];
    const tiltakIds = [];

    selectedEntities.forEach((metadata, key) => {
      // Extract ID from metadata
      // metadata.id is the direct ID (if available)
      // OR extract from renderId which is in format "entityType-id" (e.g., "prosjektkrav-2")
      let entityId = metadata.id;
      if (!entityId && metadata.renderId) {
        const parts = metadata.renderId.split('-');
        entityId = parseInt(parts[parts.length - 1], 10);
      }

      if (!entityId) {
        console.error('CombinedCopyModal: Could not extract ID from metadata:', metadata);
        return;
      }

      // Check for both camelCase and lowercase variants
      const entityType = metadata.entityType?.toLowerCase();

      if (entityType === 'prosjektkrav') {
        kravIds.push(entityId);
      } else if (entityType === 'prosjekttiltak') {
        tiltakIds.push(entityId);
      } else {
        console.warn('CombinedCopyModal: Unknown entity type:', metadata.entityType);
      }
    });

    return { kravIds, tiltakIds };
  };

  const { kravIds, tiltakIds } = separateEntitiesByType();
  const totalCount = selectedEntities.size;

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setStep(2); // Move to preview
  };

  const performCopyWithProject = async (project) => {
    try {
      setLoading(true);
      setError(null);
      setStep(3); // Progress step
      setCopyProgress(10);

      const results = {
        kravCopied: 0,
        tiltakCopied: 0,
        relatedTiltakCopied: 0,
      };

      // IMPORTANT: Copy ProsjektTiltak FIRST, then ProsjektKrav
      // This ensures that when we copy Krav's relationships, the connected Tiltak already exists in the target project

      // Copy ProsjektTiltak if any
      if (tiltakIds.length > 0 && copyFunctions.prosjektTiltak) {
        setCopyProgress(30);
        const tiltakResponse = await copyFunctions.prosjektTiltak(
          tiltakIds,
          project.id,
          currentProject.id
        );
        const tiltakData = tiltakResponse.data || tiltakResponse;
        results.tiltakCopied = tiltakData.length || 0;
      }

      // Copy ProsjektKrav if any
      if (kravIds.length > 0 && copyFunctions.prosjektKrav) {
        setCopyProgress(60);
        const kravResponse = await copyFunctions.prosjektKrav(
          kravIds,
          project.id,
          currentProject.id
        );
        const kravData = kravResponse.data || kravResponse;
        results.kravCopied = kravData.kravCount || kravData.krav?.length || 0;
        results.relatedTiltakCopied = kravData.tiltakCount || 0;
      }

      setCopyProgress(80);

      // Invalidate queries to refresh data
      // EntityWorkspace uses complex query keys: ["entities", entityType, projectId, ...]
      // Invalidate for BOTH source and target projects
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key[0] !== 'entities') return false;
          const entityType = key[1];
          const projectId = key[2];

          // Match if it's the right entity type AND (source project OR target project)
          // Entity types: "prosjektKrav", "prosjektTiltak", "combined-prosjektkrav-prosjekttiltak"
          const isRelevantEntityType =
            entityType === 'prosjektKrav' ||
            entityType === 'prosjektTiltak' ||
            entityType === 'combined-prosjektkrav-prosjekttiltak';

          const isRelevantProject =
            projectId === currentProject.id ||
            projectId === project.id;

          return isRelevantEntityType && isRelevantProject;
        }
      });

      // Also refetch active queries to ensure immediate update
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key[0] !== 'entities') return false;
          const entityType = key[1];
          const projectId = key[2];

          const isRelevantEntityType =
            entityType === 'prosjektKrav' ||
            entityType === 'prosjektTiltak' ||
            entityType === 'combined-prosjektkrav-prosjekttiltak';

          const isRelevantProject =
            projectId === currentProject.id ||
            projectId === project.id;

          return isRelevantEntityType && isRelevantProject && query.state.data !== undefined;
        },
        type: 'active' // Only refetch currently mounted queries
      });

      setCopyProgress(100);

      setCopyResult({
        ...results,
        targetProject: project,
        kravCount: kravIds.length,
        tiltakCount: tiltakIds.length,
      });

      setStep(4); // Success step

      if (onCopyComplete) {
        onCopyComplete(results);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setError("Kopiering feilet: " + (err.response?.data?.error || err.message));
      setStep(1); // Go back to project selection
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      await performCopyWithProject(selectedProject);
    } else if (step === 4) {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedProject(null);
    } else if (step === 1) {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedProject(null);
    setCopyProgress(0);
    setCopyResult(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 3) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <Heading level={2}>
            {step === 1 && `Kopier ${totalCount} element til et annet prosjekt`}
            {step === 2 && "Bekreft kopiering"}
            {step === 3 && "Kopierer..."}
            {step === 4 && "Kopiering fullført"}
          </Heading>
          <p className="text-sm text-gray-600 mt-2">
            Steg {step} av 4
          </p>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}

          {/* Step 1: Project Selection */}
          {step === 1 && (
            <ProjectSelector
              currentProjectId={currentProject?.id}
              onSelect={handleProjectSelect}
              onCancel={handleClose}
            />
          )}

          {/* Step 2: Preview */}
          {step === 2 && selectedProject && (
            <div className="space-y-6">
              <div>
                <Heading level={3}>Bekreft kopiering</Heading>
                <p className="text-sm text-gray-600 mt-2">
                  Sjekk detaljene før du starter kopieringen
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="text-sm text-blue-700">Totalt</div>
                  <div className="text-3xl font-bold text-blue-900 mt-2">
                    {totalCount}
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="text-sm text-green-700">Krav</div>
                  <div className="text-3xl font-bold text-green-900 mt-2">
                    {kravIds.length}
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="text-sm text-purple-700">Tiltak</div>
                  <div className="text-3xl font-bold text-purple-900 mt-2">
                    {tiltakIds.length}
                  </div>
                </div>
              </div>

              {/* Target project details */}
              <div className="border-t pt-4">
                <Heading level={4}>Målprosjekt detaljer</Heading>
                <div className="mt-3">
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
          )}

          {/* Step 3: Progress */}
          {step === 3 && (
            <CopyProgress
              progress={copyProgress}
              entityLabel="elementer"
            />
          )}

          {/* Step 4: Success */}
          {step === 4 && copyResult && (
            <div className="space-y-6 py-8">
              {/* Success icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>

              {/* Success message */}
              <div className="text-center">
                <Heading level={3}>Kopiering fullført!</Heading>
                <p className="text-gray-600 mt-2">
                  Element er kopiert til målprosjektet
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                {copyResult.kravCopied > 0 && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="text-sm text-green-700">Kopierte krav</div>
                    <div className="text-3xl font-bold text-green-900 mt-2">
                      {copyResult.kravCopied}
                    </div>
                  </div>
                )}

                {copyResult.tiltakCopied > 0 && (
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <div className="text-sm text-purple-700">Kopierte tiltak</div>
                    <div className="text-3xl font-bold text-purple-900 mt-2">
                      {copyResult.tiltakCopied}
                    </div>
                  </div>
                )}

                {copyResult.relatedTiltakCopied > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="text-sm text-blue-700">Relaterte tiltak</div>
                    <div className="text-3xl font-bold text-blue-900 mt-2">
                      {copyResult.relatedTiltakCopied}
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
                    <span className="font-medium">{copyResult.targetProject?.navn}</span>
                  </div>
                  {copyResult.targetProject?.prosjektnummer && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Prosjektnummer:</span>
                      <span className="font-medium">{copyResult.targetProject.prosjektnummer}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - only show for non-ProjectSelector steps */}
        {step !== 1 && (
          <>
            <Separator />
            <div className="p-6 flex justify-between">
              <Button
                variant="outline"
                onClick={step === 2 ? handleBack : handleClose}
                disabled={step === 3}
              >
                {step === 2 ? "Tilbake" : (step === 4 ? "Lukk" : "Avbryt")}
              </Button>

              {step === 2 && (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Start kopiering
                </Button>
              )}

              {step === 4 && (
                <Button onClick={handleClose}>
                  Ferdig
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
