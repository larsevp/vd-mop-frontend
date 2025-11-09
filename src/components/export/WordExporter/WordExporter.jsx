import React, { useState } from "react";
import { Download, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/primitives/dialog";
import { API } from "@/api";
import { useProjectStore } from "@/stores/userStore";

/**
 * Word Export Component for ProsjektKravTiltak entities
 * Integrates with EntityWorkspace to export filtered/searched data
 */
export const WordExporter = ({
  currentFilters = {},
  className = "",
  variant = "default",
  size = "default",
  buttonText = null, // Optional text to show instead of just icon
  showIcon = true // Whether to show the icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeKrav: true,
    includeTiltak: true,
    includeMetadata: true,
    includeRichText: true,
    includeKravreferanse: true
  });

  const { currentProject } = useProjectStore();

  const handleExport = async () => {
    if (!currentProject?.id) {
      alert("Ingen prosjekt valgt");
      return;
    }

    setIsExporting(true);

    try {
      // Prepare export request
      const exportRequest = {
        projectId: currentProject.id,
        filters: {
          ...currentFilters,
          entityType: getEntityTypeFilter()
        },
        options: exportOptions
      };


      // Call backend export endpoint
      const response = await API.post('/export/word/project-entities', exportRequest, {
        responseType: 'blob', // Important for file download
        timeout: 60000 // 60 second timeout for large exports
      });

      // Create download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const projectName = currentProject.navn || currentProject.name || currentProject.id;
      link.download = `ProsjektKravTiltak_${projectName}_${timestamp}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setIsOpen(false);

    } catch (error) {

      let errorMessage = "Ukjent feil oppstod";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Eksport feilet: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getEntityTypeFilter = () => {
    if (exportOptions.includeKrav && exportOptions.includeTiltak) {
      return "all";
    } else if (exportOptions.includeKrav) {
      return "prosjektkrav";
    } else if (exportOptions.includeTiltak) {
      return "prosjekttiltak";
    }
    return "all";
  };

  const handleOptionChange = (option, checked) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const canExport = exportOptions.includeKrav || exportOptions.includeTiltak;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={!currentProject?.id}
          title="Eksporter til Word"
        >
          {showIcon && <FileText className={`w-4 h-4 ${buttonText ? 'mr-2' : ''}`} />}
          {buttonText && <span>{buttonText}</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Eksporter til Word
          </DialogTitle>
          <DialogDescription>
            Eksporter prosjektdata til Word-dokument med valgbare innstillinger
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Info */}
          {currentProject && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Prosjekt: {currentProject.navn || currentProject.name}</p>
              {Object.keys(currentFilters).length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aktive filtre vil bli tatt med i eksporten
                </p>
              )}
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Eksport innstillinger
            </div>

            <div className="space-y-2 pl-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeKrav"
                  checked={exportOptions.includeKrav}
                  onChange={(e) => handleOptionChange('includeKrav', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeKrav" className="text-sm">
                  Inkluder prosjektkrav
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTiltak"
                  checked={exportOptions.includeTiltak}
                  onChange={(e) => handleOptionChange('includeTiltak', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeTiltak" className="text-sm">
                  Inkluder prosjekttiltak
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeMetadata"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeMetadata" className="text-sm">
                  Inkluder metadata (status, prioritet, etc.)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeRichText"
                  checked={exportOptions.includeRichText}
                  onChange={(e) => handleOptionChange('includeRichText', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeRichText" className="text-sm">
                  Inkluder rik tekst innhold
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeKravreferanse"
                  checked={exportOptions.includeKravreferanse}
                  onChange={(e) => handleOptionChange('includeKravreferanse', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeKravreferanse" className="text-sm">
                  Inkluder kravreferanser
                </label>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleExport}
              disabled={!canExport || isExporting}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Eksporterer...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Eksporter
                </div>
              )}
            </Button>
          </div>

          {!canExport && (
            <p className="text-sm text-muted-foreground text-center">
              Velg minst en type innhold å eksportere
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};