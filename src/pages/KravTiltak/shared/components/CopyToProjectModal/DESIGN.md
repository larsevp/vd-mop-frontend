# CopyToProjectModal Component Design

## Overview

A comprehensive modal dialog for copying selected Krav/Tiltak entities to a project with preview, options, and progress tracking.

## Component Structure

```
CopyToProjectModal/
├── index.js                    // Barrel export
├── CopyToProjectModal.jsx      // Main modal component
├── ProjectSelector.jsx         // Project selection step
├── CopyOptions.jsx            // Options configuration step
├── CopyPreview.jsx            // Preview what will be copied
├── CopyProgress.jsx           // Progress during copy operation
├── CopyResults.jsx            // Results summary
└── useCopyToProject.js        // Custom hook for copy logic
```

## Modal Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Project Selection                                   │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Velg målprosjekt                                            │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔍 Søk prosjekter...                                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ○ Prosjekt A (P-2024-001)                              │  │
│ │ ● Prosjekt B (P-2024-002) ← Selected                   │  │
│ │ ○ Prosjekt C (P-2024-003)                              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│                        [Avbryt]  [Neste →]                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Options                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Kopieringsalternativer                                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ☑ Inkluder hierarki (overordnede/underordnede)        │  │
│ │ ☑ Inkluder vedlegg                                     │  │
│ │ ☑ Inkluder relasjoner til andre enheter                │  │
│ │ ☐ Inkluder relaterte tiltak (kun for krav)             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Håndtering av duplikater:                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ○ Hopp over duplikater                                 │  │
│ │ ● Opprett uansett (standard)                           │  │
│ │ ○ Spør for hver                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│                    [← Tilbake]  [Neste →]                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Preview                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Forhåndsvisning                                             │
│                                                              │
│ Kopierer til: Prosjekt B (P-2024-001)                       │
│                                                              │
│ Vil kopiere:                                                 │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ✓ 15 krav                                              │  │
│ │ ✓ 23 tiltak (inkludert relaterte)                      │  │
│ │ ✓ 8 vedlegg                                            │  │
│ │ ⚠ 3 duplikater funnet (vil bli hoppet over)            │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Estimert tid: ~5 sekunder                                   │
│                                                              │
│                    [← Tilbake]  [Kopier]                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Progress                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Kopierer...                                                 │
│                                                              │
│ ████████████████████░░░░░░░░░░ 65% (24/38)                  │
│                                                              │
│ Status: Kopierer tiltak med relasjoner...                   │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ✓ Kopiert 15 krav                                      │  │
│ │ ↻ Kopierer 9 tiltak... (24/38)                         │  │
│ │ ⏳ Venter: Vedlegg                                      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│                           [Avbryt]                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Results                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ ✓ Kopiering fullført!                                       │
│                                                              │
│ Resultat:                                                    │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ✓ 15 krav kopiert                                      │  │
│ │ ✓ 23 tiltak kopiert                                    │  │
│ │ ✓ 8 vedlegg kopiert                                    │  │
│ │ ⚠ 3 duplikater hoppet over                             │  │
│ │ ✗ 2 feil (se detaljer)                                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ De kopierte enhetene er nå tilgjengelige i:                 │
│ Prosjekt B (P-2024-001)                                     │
│                                                              │
│               [Vis detaljer]  [Lukk]  [Gå til prosjekt]    │
└─────────────────────────────────────────────────────────────┘
```

## Props API

```typescript
interface CopyToProjectModalProps {
  // Control
  open: boolean;
  onClose: () => void;
  onComplete?: (result: CopyResult) => void;

  // Source data
  selectedIds: Set<number> | Map<string, any>;
  selectedEntitiesMetadata?: Map<string, EntityMetadata>;
  entityType: 'krav' | 'tiltak' | 'prosjektKrav' | 'prosjektTiltak' | 'combined';

  // Context
  currentProjectId?: number; // For ProsjektKrav/Tiltak workspaces

  // Customization
  title?: string;
  allowedEntityTypes?: string[]; // For combined workspaces
  defaultOptions?: CopyOptions;

  // API functions (injected)
  copyFunction: (params: CopyParams) => Promise<CopyResult>;
  previewFunction?: (params: PreviewParams) => Promise<PreviewResult>;
}

interface CopyOptions {
  includeHierarchy: boolean;
  includeFiles: boolean;
  includeRelations: boolean;
  includeRelatedTiltak: boolean; // Krav only
  duplicateHandling: 'skip' | 'create' | 'ask';
}

interface CopyParams {
  sourceIds: number[];
  targetProjectId: number;
  options: CopyOptions;
  entityType: string;
  sourceProjectId?: number;
}

interface CopyResult {
  success: boolean;
  copiedCount: number;
  skippedCount: number;
  errorCount: number;
  duplicates: number[];
  errors: Array<{ id: number; error: string }>;
  estimatedTime?: number;
}

interface PreviewResult {
  totalCount: number;
  kravCount: number;
  tiltakCount: number;
  fileCount: number;
  duplicateCount: number;
  duplicateIds: number[];
  estimatedTime: number;
}
```

## Component Implementation

### CopyToProjectModal.jsx

```javascript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { ProjectSelector } from './ProjectSelector';
import { CopyOptions } from './CopyOptions';
import { CopyPreview } from './CopyPreview';
import { CopyProgress } from './CopyProgress';
import { CopyResults } from './CopyResults';
import { useCopyToProject } from './useCopyToProject';

const STEPS = {
  SELECT_PROJECT: 'select_project',
  OPTIONS: 'options',
  PREVIEW: 'preview',
  PROGRESS: 'progress',
  RESULTS: 'results',
};

export const CopyToProjectModal = ({
  open,
  onClose,
  onComplete,
  selectedIds,
  selectedEntitiesMetadata,
  entityType,
  currentProjectId,
  title = 'Kopier til prosjekt',
  defaultOptions = {
    includeHierarchy: true,
    includeFiles: true,
    includeRelations: true,
    includeRelatedTiltak: false,
    duplicateHandling: 'skip',
  },
  copyFunction,
  previewFunction,
}) => {
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_PROJECT);
  const [selectedProject, setSelectedProject] = useState(null);
  const [options, setOptions] = useState(defaultOptions);
  const [previewData, setPreviewData] = useState(null);

  const {
    isLoading,
    progress,
    result,
    executePreview,
    executeCopy,
    reset,
  } = useCopyToProject({ copyFunction, previewFunction });

  const handleClose = () => {
    reset();
    setCurrentStep(STEPS.SELECT_PROJECT);
    setSelectedProject(null);
    setPreviewData(null);
    onClose();
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setCurrentStep(STEPS.OPTIONS);
  };

  const handleOptionsNext = async () => {
    setCurrentStep(STEPS.PREVIEW);

    // Load preview if function provided
    if (previewFunction) {
      const preview = await executePreview({
        sourceIds: Array.from(selectedIds),
        targetProjectId: selectedProject.id,
        options,
        entityType,
        sourceProjectId: currentProjectId,
      });
      setPreviewData(preview);
    }
  };

  const handleCopy = async () => {
    setCurrentStep(STEPS.PROGRESS);

    const result = await executeCopy({
      sourceIds: Array.from(selectedIds),
      targetProjectId: selectedProject.id,
      options,
      entityType,
      sourceProjectId: currentProjectId,
    });

    setCurrentStep(STEPS.RESULTS);

    if (onComplete) {
      onComplete(result);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.SELECT_PROJECT:
        return (
          <ProjectSelector
            currentProjectId={currentProjectId}
            onSelect={handleProjectSelect}
            onCancel={handleClose}
          />
        );

      case STEPS.OPTIONS:
        return (
          <CopyOptions
            entityType={entityType}
            options={options}
            onChange={setOptions}
            onBack={() => setCurrentStep(STEPS.SELECT_PROJECT)}
            onNext={handleOptionsNext}
            selectedCount={selectedIds.size}
          />
        );

      case STEPS.PREVIEW:
        return (
          <CopyPreview
            selectedProject={selectedProject}
            previewData={previewData}
            selectedCount={selectedIds.size}
            options={options}
            isLoading={isLoading}
            onBack={() => setCurrentStep(STEPS.OPTIONS)}
            onCopy={handleCopy}
          />
        );

      case STEPS.PROGRESS:
        return (
          <CopyProgress
            progress={progress}
            onCancel={() => {
              // TODO: Implement cancel
              handleClose();
            }}
          />
        );

      case STEPS.RESULTS:
        return (
          <CopyResults
            result={result}
            selectedProject={selectedProject}
            onClose={handleClose}
            onGoToProject={() => {
              // TODO: Navigate to target project
              handleClose();
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <h2 className="text-xl font-medium">{title}</h2>
          <p className="text-sm text-gray-600">
            {selectedIds.size} {entityType === 'krav' ? 'krav' : 'tiltak'} valgt
          </p>
        </DialogHeader>

        {/* Progress indicator */}
        {currentStep !== STEPS.RESULTS && (
          <div className="flex items-center gap-2 mb-6">
            <Step active={currentStep === STEPS.SELECT_PROJECT} completed={currentStep !== STEPS.SELECT_PROJECT}>1</Step>
            <div className="flex-1 h-px bg-gray-200" />
            <Step active={currentStep === STEPS.OPTIONS} completed={[STEPS.PREVIEW, STEPS.PROGRESS, STEPS.RESULTS].includes(currentStep)}>2</Step>
            <div className="flex-1 h-px bg-gray-200" />
            <Step active={currentStep === STEPS.PREVIEW} completed={[STEPS.PROGRESS, STEPS.RESULTS].includes(currentStep)}>3</Step>
            <div className="flex-1 h-px bg-gray-200" />
            <Step active={currentStep === STEPS.PROGRESS} completed={currentStep === STEPS.RESULTS}>4</Step>
          </div>
        )}

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};

const Step = ({ active, completed, children }) => (
  <div className={`
    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
    ${completed ? 'bg-green-500 text-white' : ''}
    ${active ? 'bg-sky-600 text-white' : ''}
    ${!active && !completed ? 'bg-gray-200 text-gray-600' : ''}
  `}>
    {completed ? '✓' : children}
  </div>
);
```

### useCopyToProject.js Hook

```javascript
import { useState } from 'react';

export const useCopyToProject = ({ copyFunction, previewFunction }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const executePreview = async (params) => {
    if (!previewFunction) return null;

    setIsLoading(true);
    setError(null);

    try {
      const preview = await previewFunction(params);
      return preview;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const executeCopy = async (params) => {
    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: params.sourceIds.length, status: 'Starter...' });

    try {
      // TODO: Implement progress tracking via WebSocket or polling
      const result = await copyFunction(params);
      setResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setProgress({ current: 0, total: 0, status: '' });
    setResult(null);
    setError(null);
  };

  return {
    isLoading,
    progress,
    result,
    error,
    executePreview,
    executeCopy,
    reset,
  };
};
```

## Usage Examples

### In KravWorkspace (Krav → ProsjektKrav)

```javascript
import { CopyToProjectModal } from '@/pages/KravTiltak/shared/components/CopyToProjectModal';
import { copyKravToProject, getImportPreview } from '@/api/endpoints';

const KravWorkspace = () => {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const ui = useKravUIStore();

  const bulkActions = [
    {
      label: 'Kopier til prosjekt',
      icon: Copy,
      onClick: () => setShowCopyModal(true),
    },
    // ... other actions
  ];

  return (
    <>
      <EntityWorkspace
        renderListHeading={(props) => (
          <RowListHeading {...props} bulkActions={bulkActions} />
        )}
      />

      <CopyToProjectModal
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        selectedIds={ui.selectedEntities}
        entityType="krav"
        copyFunction={(params) => copyKravToProject(
          params.targetProjectId,
          params.sourceIds,
          null, // filters
          params.options.includeRelatedTiltak
        )}
        previewFunction={(params) => getImportPreview(
          params.targetProjectId,
          { kravIds: params.sourceIds }
        )}
      />
    </>
  );
};
```

### In ProsjektKravWorkspace (ProsjektKrav → ProsjektKrav)

```javascript
const ProsjektKravWorkspace = () => {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const ui = useProsjektKravUIStore();
  const { currentProject } = useProjectStore();

  return (
    <>
      <EntityWorkspace ... />

      <CopyToProjectModal
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        selectedIds={ui.selectedEntities}
        entityType="prosjektKrav"
        currentProjectId={currentProject.id}
        copyFunction={(params) => massCopyProsjektKravToProject(
          params.sourceProjectId,
          params.targetProjectId,
          params.sourceIds,
          params.options
        )}
      />
    </>
  );
};
```

## Scandinavian Design Principles

- **Clean, crisp layout** with generous whitespace
- **Neutral colors**: Gray backgrounds, sky-600 for primary actions
- **Subtle borders**: border-2 for definition
- **No heavy shadows**: Use border-gray-200 for separation
- **Purposeful icons**: lucide-react icons
- **Clear typography**: font-medium for headings, normal for body
- **Minimal animations**: Smooth transitions only
- **Function over form**: Every element serves a purpose

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ ARIA labels and roles
- ✅ Focus management (return focus on close)
- ✅ Screen reader announcements for progress
- ✅ Sufficient color contrast
- ✅ Error messages clearly associated with inputs

## Performance Considerations

- Lazy load project list (only fetch on modal open)
- Debounce search input (300ms)
- Virtualize project list if > 50 projects
- Show progress for operations > 2 seconds
- Cancel operation support (AbortController)
