import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/primitives/button';
import { Heading } from '@/components/ui/primitives/heading';
import { Separator } from '@/components/ui/primitives/separator';
import { useProjectStore } from '@/stores/userStore';
import { ProjectSelector } from './ProjectSelector';
import { CopyPreview } from './CopyPreview';
import { CopyProgress } from './CopyProgress';
import { CopySuccess } from './CopySuccess';

/**
 * CopyToProjectModal - Multi-step wizard for copying entities to another project
 *
 * Steps:
 * 1. Select target project
 * 2. Preview and confirm
 * 3. Progress indicator during copy
 * 4. Success summary
 */
export const CopyToProjectModal = ({
  open,
  onClose,
  selectedEntities = [],
  entityType, // 'prosjektkrav' | 'prosjekttiltak' | 'krav' | 'tiltak'
  onCopyComplete,
  copyFunction, // API function to call for copying
  isGenerelleEntities = false, // Set to true when copying generelle Krav/Tiltak (no source project context)
}) => {
  const queryClient = useQueryClient();
  const { currentProject } = useProjectStore();

  // For generelle entities, don't use any source project (allow copying to any project including current)
  const effectiveSourceProjectId = isGenerelleEntities ? null : currentProject?.id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [copyProgress, setCopyProgress] = useState(0);
  const [copyResult, setCopyResult] = useState(null);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    // Move to preview step
    setStep(2);
  };

  const performCopyWithProject = async (project) => {
    try {
      setLoading(true);
      setError(null);
      setStep(3); // Progress step
      setCopyProgress(5);

      const entityIds = Array.from(selectedEntities);

      // Call the provided copy function with progress callback
      const response = await copyFunction(
        entityIds,
        project.id,
        currentProject.id,
        false, // includeRelatedTiltak
        (progress) => setCopyProgress(Math.min(progress, 90)) // Cap at 90% until queries invalidated
      );

      // Extract results
      const data = response.data || response;
      let copiedCount = 0;
      let relatedCount = 0;

      if (entityType === 'prosjektkrav') {
        copiedCount = data.kravCount || data.krav?.length || 0;
        relatedCount = data.tiltakCount || 0;
      } else if (entityType === 'prosjekttiltak') {
        // Handle both old format (array) and new format ({ tiltak, tiltakCount, idMapping })
        copiedCount = data.tiltakCount || data.tiltak?.length || data.length || 0;
      }

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
            projectId === effectiveSourceProjectId ||
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
            projectId === effectiveSourceProjectId ||
            projectId === project.id;

          return isRelevantEntityType && isRelevantProject && query.state.data !== undefined;
        },
        type: 'active' // Only refetch currently mounted queries
      });

      setCopyProgress(100);

      setCopyResult({
        copiedCount,
        relatedCount,
        entityType,
        targetProject: project
      });

      setStep(4); // Success step

      if (onCopyComplete) {
        onCopyComplete(data);
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
      // Start copy from preview
      await performCopyWithProject(selectedProject);
    } else if (step === 4) {
      // Close wizard
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
    // Reset state
    setStep(1);
    setSelectedProject(null);
    setCopyProgress(0);
    setCopyResult(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  const entityLabel = entityType === 'prosjektkrav' ? 'krav' : 'tiltak';
  const entityLabelPlural = entityType === 'prosjektkrav' ? 'krav' : 'tiltak';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // Close if clicking backdrop (not during progress)
        if (e.target === e.currentTarget && step !== 2) {
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
            {step === 1 && `Kopier ${selectedEntities.size} ${entityLabelPlural} til et annet prosjekt`}
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
              currentProjectId={effectiveSourceProjectId}
              onSelect={handleProjectSelect}
              onCancel={handleClose}
            />
          )}

          {/* Step 2: Preview */}
          {step === 2 && selectedProject && (
            <CopyPreview
              selectedProject={selectedProject}
              selectedCount={selectedEntities.size}
              entityLabel={entityLabel}
              entityLabelPlural={entityLabelPlural}
            />
          )}

          {/* Step 3: Progress */}
          {step === 3 && (
            <CopyProgress
              progress={copyProgress}
              entityLabel={entityLabelPlural}
            />
          )}

          {/* Step 4: Success */}
          {step === 4 && copyResult && (
            <CopySuccess
              result={copyResult}
            />
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
