import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import { Heading } from "@/components/ui/primitives/heading";
import { Separator } from "@/components/ui/primitives/separator";
import { getKravpakkerSimple } from "@/api/endpoints/models/kravpakker";
import { copyKravToProject, getImportPreview } from "@/api/endpoints/models/prosjektKrav";
import { updateProsjekt, getProsjektById } from "@/api/endpoints/models/prosjekt";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

/**
 * Multi-step wizard for importing obligatory Krav and Kravpakker into a project
 *
 * Steps:
 * 1. Select Kravpakker (with obligatoriske krav always included)
 * 2. Preview counts and duplicates
 * 3. Progress indicator during import
 * 4. Success summary
 */
const ImportKravWizard = ({ open, onClose, projectId, onImportComplete }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Selection
  const [kravpakker, setKravpakker] = useState([]);
  const [selectedKravpakkeIds, setSelectedKravpakkeIds] = useState([]);
  const [includeObligatorisk, setIncludeObligatorisk] = useState(true);

  // Step 2: Preview data
  const [previewData, setPreviewData] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Step 3: Progress
  const [importProgress, setImportProgress] = useState(0);

  // Step 4: Result
  const [importResult, setImportResult] = useState(null);

  // Load Kravpakker on mount
  useEffect(() => {
    if (open) {
      loadKravpakker();
    }
  }, [open]);

  const loadKravpakker = async () => {
    try {
      setLoading(true);
      const response = await getKravpakkerSimple();
      setKravpakker(response.data || []);
    } catch (err) {
      setError("Kunne ikke laste kravpakker: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKravpakkeToggle = (kravpakkeId) => {
    setSelectedKravpakkeIds(prev =>
      prev.includes(kravpakkeId)
        ? prev.filter(id => id !== kravpakkeId)
        : [...prev, kravpakkeId]
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      // Move to preview
      await loadPreview();
    } else if (step === 2) {
      // Start import
      if (previewData?.hasDuplicates && !showDuplicateWarning) {
        setShowDuplicateWarning(true);
        return;
      }
      await performImport();
    } else if (step === 4) {
      // Close wizard
      handleClose();
    }
  };

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        includeRelatedTiltak: true, // Always import related tiltak
      };

      if (includeObligatorisk) {
        filters.obligatorisk = true;
      }

      if (selectedKravpakkeIds.length > 0) {
        filters.kravpakkeIds = selectedKravpakkeIds;
      }

      // Need at least one filter
      if (!filters.obligatorisk && selectedKravpakkeIds.length === 0) {
        setError("Velg minst én kravpakke eller inkluder obligatoriske krav");
        return;
      }

      const response = await getImportPreview(projectId, filters);
      setPreviewData(response.data);
      setStep(2);
    } catch (err) {
      setError("Kunne ikke hente forhåndsvisning: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const performImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep(3);
      setImportProgress(10);

      const filters = {};

      if (includeObligatorisk) {
        filters.obligatorisk = true;
      }

      if (selectedKravpakkeIds.length > 0) {
        filters.kravpakkeIds = selectedKravpakkeIds;
      }

      setImportProgress(30);

      // Single API call - backend handles both Krav and related Tiltak atomically
      const response = await copyKravToProject(projectId, null, {
        ...filters,
        includeRelatedTiltak: true  // Backend handles everything in one transaction!
      });

      setImportProgress(70);

      // Extract counts from single response
      const data = response.data || {};
      const kravCount = data.kravCount || data.krav?.length || 0;
      const tiltakCount = data.tiltakCount || 0;

      // Update prosjektJson to mark import as complete
      const prosjektResponse = await getProsjektById(projectId);
      const prosjekt = prosjektResponse.data;

      const updatedProsjektJson = {
        ...(prosjekt.prosjektJson || {}),
        importMetadata: {
          completed: true,
          timestamp: new Date().toISOString(),
          importedCounts: {
            krav: kravCount,
            tiltak: tiltakCount,
          },
          selectedKravpakkerIds: selectedKravpakkeIds,
          filters: {
            obligatorisk: includeObligatorisk,
          },
        },
      };

      await updateProsjekt({
        id: projectId,
        prosjektJson: updatedProsjektJson,
      });

      setImportProgress(95);

      // Clear all entity queries for this project from cache
      // This forces a fresh fetch when components mount
      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Match: ["entities", entityType, projectId, ...]
          return (
            Array.isArray(key) &&
            key.length >= 3 &&
            key[0] === 'entities' &&
            key[2] === projectId
          );
        },
      });

      setImportProgress(100);

      setImportResult({
        kravCount,
        tiltakCount,
      });

      setStep(4);

      if (onImportComplete) {
        onImportComplete(response.data);
      }
    } catch (err) {
      setError("Import feilet: " + err.message);
      setStep(2); // Go back to preview
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1 && step !== 3) {
      setStep(step - 1);
      setShowDuplicateWarning(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setSelectedKravpakkeIds([]);
    setIncludeObligatorisk(true);
    setPreviewData(null);
    setShowDuplicateWarning(false);
    setImportProgress(0);
    setImportResult(null);
    setError(null);

    onClose();
  };

  const canProceed = () => {
    if (step === 1) {
      return includeObligatorisk || selectedKravpakkeIds.length > 0;
    }
    if (step === 2) {
      return previewData && previewData.totalKrav > 0;
    }
    return false;
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={(e) => {
          // Close if clicking backdrop (not the dialog itself)
          if (e.target === e.currentTarget && step !== 3) {
            handleClose();
          }
        }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b">
            <Heading level={2}>
              {step === 1 && "Importer krav til prosjekt"}
              {step === 2 && "Bekreft import"}
              {step === 3 && "Importerer..."}
              {step === 4 && "Import fullført"}
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

            {/* Step 1: Selection */}
            {step === 1 && (
              <Step1Selection
                kravpakker={kravpakker}
                selectedKravpakkeIds={selectedKravpakkeIds}
                includeObligatorisk={includeObligatorisk}
                onToggleKravpakke={handleKravpakkeToggle}
                onToggleObligatorisk={() => setIncludeObligatorisk(!includeObligatorisk)}
                loading={loading}
              />
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
              <Step2Preview
                previewData={previewData}
                showDuplicateWarning={showDuplicateWarning}
                includeObligatorisk={includeObligatorisk}
                selectedKravpakkeCount={selectedKravpakkeIds.length}
              />
            )}

            {/* Step 3: Progress */}
            {step === 3 && (
              <Step3Progress progress={importProgress} />
            )}

            {/* Step 4: Success */}
            {step === 4 && importResult && (
              <Step4Success result={importResult} />
            )}
          </div>

          {/* Footer */}
          <Separator />
          <div className="p-6 flex justify-between">
            <Button
              variant="outline"
              onClick={step === 4 ? handleClose : (step === 1 ? handleClose : handleBack)}
              disabled={step === 3 || loading}
            >
              {step === 4 ? "Lukk" : (step === 1 ? "Avbryt" : "Tilbake")}
            </Button>

            {step !== 4 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
              >
                {loading && "Laster..."}
                {!loading && step === 1 && "Neste"}
                {!loading && step === 2 && (showDuplicateWarning ? "Importer likevel" : "Start import")}
                {!loading && step === 3 && "Importerer..."}
              </Button>
            )}

            {step === 4 && (
              <Button onClick={handleClose}>
                Ferdig
              </Button>
            )}
          </div>
        </div>
        </div>
      )}
    </>
  );
};

// Step 1: Kravpakker Selection
const Step1Selection = ({
  kravpakker,
  selectedKravpakkeIds,
  includeObligatorisk,
  onToggleKravpakke,
  onToggleObligatorisk,
  loading
}) => {
  if (loading) {
    return <div className="text-center py-8">Laster kravpakker...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading level={3}>Hva skal importeres?</Heading>
        <p className="text-sm text-gray-600 mt-2">
          Velg hvilke krav som skal kopieres inn i prosjektet.
          Krav som allerede finnes vil bli oppdaget i neste steg.
        </p>
      </div>

      {/* Obligatorisk checkbox */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeObligatorisk}
            onChange={onToggleObligatorisk}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <div className="font-medium text-blue-900">
              Importer alle obligatoriske krav
            </div>
            <div className="text-sm text-blue-700 mt-1">
              Alle krav merket som obligatoriske vil bli importert
            </div>
          </div>
        </label>
      </div>

      <Separator />

      {/* Kravpakker list */}
      <div>
        <Heading level={4}>Velg kravpakker (valgfritt)</Heading>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Alle krav i de valgte kravpakkene vil bli importert
        </p>

        {kravpakker.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Ingen kravpakker tilgjengelig
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
            {kravpakker.map((kravpakke) => (
              <label
                key={kravpakke.id}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedKravpakkeIds.includes(kravpakke.id)}
                  onChange={() => onToggleKravpakke(kravpakke.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{kravpakke.tittel}</div>
                  {kravpakke.beskrivelse && (
                    <div className="text-sm text-gray-600 mt-1">
                      {kravpakke.beskrivelse}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Step 2: Preview
const Step2Preview = ({ previewData, showDuplicateWarning, includeObligatorisk, selectedKravpakkeCount }) => {
  if (!previewData) {
    return <div className="text-center py-8">Laster forhåndsvisning...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading level={3}>Forhåndsvisning</Heading>
        <p className="text-sm text-gray-600 mt-2">
          Sjekk antall krav som vil bli importert
        </p>
      </div>

      {/* Duplicate warning */}
      {previewData.hasDuplicates && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium text-yellow-900">
                Duplikater funnet
              </div>
              <div className="text-sm text-yellow-800 mt-1">
                {previewData.duplicateKrav} krav er allerede importert i prosjektet.
                De vil ikke bli importert på nytt.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-sm text-gray-600">Totalt krav funnet</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {previewData.totalKrav}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-sm text-green-700">Nye krav</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {previewData.newKrav}
          </div>
        </div>

        {previewData.hasDuplicates && (
          <div className="border rounded-lg p-4 bg-yellow-50">
            <div className="text-sm text-yellow-700">Allerede importert</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">
              {previewData.duplicateKrav}
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="text-sm text-blue-700">Tilhørende tiltak</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {previewData.estimatedTiltak}
          </div>
        </div>
      </div>

      {/* Configuration summary */}
      <div className="border-t pt-4">
        <Heading level={4}>Importinnstillinger</Heading>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {includeObligatorisk && (
            <li className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Obligatoriske krav inkludert</span>
            </li>
          )}
          {selectedKravpakkeCount > 0 && (
            <li className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{selectedKravpakkeCount} kravpakke(r) valgt</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

// Step 3: Progress
const Step3Progress = ({ progress }) => {
  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <Heading level={3}>Importerer krav...</Heading>
        <p className="text-sm text-gray-600 mt-2">
          Vennligst vent mens kravene kopieres til prosjektet
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="text-center text-sm text-gray-600">
        {progress}% fullført
      </div>
    </div>
  );
};

// Step 4: Success
const Step4Success = ({ result }) => {
  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <Heading level={3}>Import fullført!</Heading>
        <p className="text-sm text-gray-600 mt-2">
          Kravene har blitt importert til prosjektet
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-green-50 text-center">
          <div className="text-sm text-green-700">Importerte krav</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {result.kravCount}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-blue-50 text-center">
          <div className="text-sm text-blue-700">Tilhørende tiltak</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {result.tiltakCount}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600">
        Kravene er nå tilgjengelige i prosjektet og kan redigeres
      </div>
    </div>
  );
};

export default ImportKravWizard;
