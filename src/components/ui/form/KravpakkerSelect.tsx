import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getKravpakkerSimple as getKravpakker, createKravpakker } from "../../../api/endpoints/models/kravpakker";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import GenericMultiSelect from "./GenericMultiSelect";
import { Button } from "../primitives/button";
import { Plus, X } from "lucide-react";

interface Kravpakke {
  id: number;
  tittel: string;
}

interface KravpakkerSelectProps {
  name?: string;
  label?: string;
  value?: number | null;
  onChange: (event: { target: { name?: string; value: number | null; type: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  error?: string | null;
  availableIds?: number[];
}

interface KravpakkerCheckboxGroupProps {
  label?: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function KravpakkerSelect({
  name,
  label = "Kravpakker",
  value,
  onChange,
  placeholder = "Søk eller velg kravpakke...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen kravpakke",
  className = "",
  error: validationError,
  availableIds,
}: KravpakkerSelectProps) {
  const queryClient = useQueryClient();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKravpakkeTittel, setNewKravpakkeTittel] = useState("");
  const [newKravpakkeBeskrivelse, setNewKravpakkeBeskrivelse] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: kravpakkerList = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["kravpakker"],
    queryFn: getKravpakker,
    select: (response: any): Kravpakke[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter by available IDs if provided
      let filteredData = data;
      if (availableIds && availableIds.length > 0) {
        filteredData = data.filter((item: Kravpakke) => availableIds.includes(item.id));
      }

      // Sort by tittel
      return filteredData.sort((a: Kravpakke, b: Kravpakke) => {
        return (a.tittel || "").localeCompare(b.tittel || "");
      });
    },
  });

  // Convert Kravpakke[] to ComboBoxOption[]
  const options: ComboBoxOption[] = React.useMemo(() => {
    return kravpakkerList.map((kravpakke) => ({
      id: kravpakke.id.toString(),
      label: kravpakke.tittel || `Kravpakke ${kravpakke.id}`,
    }));
  }, [kravpakkerList]);

  // Handle the ComboBox onChange and convert back to number
  const handleChange = (event: { target: { name?: string; value: string | null; type: string } }) => {
    const numericValue = event.target.value === null ? null : parseInt(event.target.value, 10);
    onChange({
      target: {
        name: event.target.name,
        value: numericValue,
        type: event.target.type,
      },
    });
  };

  // Handle create new kravpakke
  const handleCreateKravpakke = async () => {
    if (!newKravpakkeTittel.trim()) {
      setCreateError("Tittel er påkrevd");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await createKravpakker({
        tittel: newKravpakkeTittel.trim(),
        beskrivelse: newKravpakkeBeskrivelse.trim() || undefined,
      });

      // Extract the created kravpakke ID
      const createdKravpakke = result?.data || result;
      const newKravpakkeId = createdKravpakke?.id;

      // Invalidate and refetch kravpakker list
      // Invalidate all kravpakker queries (including GenericMultiSelect's dynamic query key)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "kravpakker" ||
                 (key[0] === "multiselect" && typeof key[1] === "string" && key[1].includes("Kravpakker"));
        }
      });

      // Update the form field with the new kravpakke
      if (newKravpakkeId) {
        onChange({
          target: {
            name,
            value: newKravpakkeId,
            type: "select",
          },
        });
      }

      // Close modal and reset
      setShowCreateModal(false);
      setNewKravpakkeTittel("");
      setNewKravpakkeBeskrivelse("");
    } catch (error: any) {
      console.error("Failed to create kravpakke:", error);
      // Check for unique constraint error
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        const tittelError = details.find((d: any) => d.field === "tittel");
        setCreateError(tittelError?.message || "Kunne ikke opprette kravpakke");
      } else {
        setCreateError(error instanceof Error ? error.message : "Kunne ikke opprette kravpakke");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <ComboBox
            name={name}
            label={label}
            value={value?.toString() || null}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={className}
            allowEmpty={allowEmpty}
            emptyLabel={emptyLabel}
            options={options}
            isLoading={isLoading}
            error={validationError || (queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null)}
            filterFn={(option, searchValue) => option.label.toLowerCase().includes(searchValue.toLowerCase())}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCreateModal(true)}
          disabled={disabled}
          className="h-9 w-9 flex-shrink-0"
          title="Opprett ny kravpakke"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Kravpakke Modal - Custom portal with z-[110] to appear above flow detail modal (z-[100]) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[425px] mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Opprett ny kravpakke</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKravpakkeTittel("");
                    setNewKravpakkeBeskrivelse("");
                    setCreateError(null);
                  }}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  disabled={isCreating}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Lukk</span>
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="kravpakke-tittel" className="text-sm font-medium">
                    Tittel <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="kravpakke-tittel"
                    type="text"
                    value={newKravpakkeTittel}
                    onChange={(e) => setNewKravpakkeTittel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="F.eks. BREEAM-NOR, TEK17..."
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="kravpakke-beskrivelse" className="text-sm font-medium">
                    Beskrivelse
                  </label>
                  <textarea
                    id="kravpakke-beskrivelse"
                    value={newKravpakkeBeskrivelse}
                    onChange={(e) => setNewKravpakkeBeskrivelse(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Skriv inn beskrivelse..."
                    disabled={isCreating}
                  />
                </div>
                {createError && (
                  <div className="text-sm text-red-600">{createError}</div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKravpakkeTittel("");
                    setNewKravpakkeBeskrivelse("");
                    setCreateError(null);
                  }}
                  disabled={isCreating}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateKravpakke}
                  disabled={isCreating || !newKravpakkeTittel.trim()}
                >
                  {isCreating ? "Oppretter..." : "Opprett"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function KravpakkerCheckboxGroup({
  selectedValues,
  onChange,
  disabled,
  placeholder,
  config,
}: any) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKravpakkeTittel, setNewKravpakkeTittel] = useState("");
  const [newKravpakkeBeskrivelse, setNewKravpakkeBeskrivelse] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateKravpakke = async () => {
    if (!newKravpakkeTittel.trim()) {
      setCreateError("Tittel er påkrevd");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await createKravpakker({
        tittel: newKravpakkeTittel.trim(),
        beskrivelse: newKravpakkeBeskrivelse.trim() || undefined,
      });

      const createdKravpakke = result?.data || result;
      const newKravpakkeId = createdKravpakke?.id;

      // Invalidate all kravpakker queries (including GenericMultiSelect's dynamic query key)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "kravpakker" ||
                 (key[0] === "multiselect" && typeof key[1] === "string" && key[1].includes("Kravpakker"));
        }
      });

      // Don't auto-select - let user decide if they want to select it (industry standard for multiselect)

      setShowCreateModal(false);
      setNewKravpakkeTittel("");
      setNewKravpakkeBeskrivelse("");
    } catch (error: any) {
      console.error("Failed to create kravpakke:", error);
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        const tittelError = details.find((d: any) => d.field === "tittel");
        setCreateError(tittelError?.message || "Kunne ikke opprette kravpakke");
      } else {
        setCreateError(error instanceof Error ? error.message : "Kunne ikke opprette kravpakke");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <GenericMultiSelect
            selectedValues={selectedValues}
            onSelectionChange={onChange}
            disabled={disabled}
            apiEndpoint={config.apiEndpoint}
            valueField={config.valueField}
            labelField={config.labelField}
            customLabelFormatter={config.customLabelFormatter}
            descriptionField={config.descriptionField}
            placeholder={placeholder}
            searchPlaceholder={config.searchPlaceholder}
            emptyMessage={config.emptyMessage}
            loadingMessage={config.loadingMessage}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCreateModal(true)}
          disabled={disabled}
          className="h-9 w-9 flex-shrink-0 mt-0.5"
          title="Opprett ny kravpakke"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[425px] mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Opprett ny kravpakke</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKravpakkeTittel("");
                    setNewKravpakkeBeskrivelse("");
                    setCreateError(null);
                  }}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  disabled={isCreating}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Lukk</span>
                </button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="kravpakke-tittel-modal" className="text-sm font-medium">
                    Tittel <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="kravpakke-tittel-modal"
                    type="text"
                    value={newKravpakkeTittel}
                    onChange={(e) => setNewKravpakkeTittel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="F.eks. BREEAM-NOR, TEK17..."
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="kravpakke-beskrivelse-modal" className="text-sm font-medium">
                    Beskrivelse
                  </label>
                  <textarea
                    id="kravpakke-beskrivelse-modal"
                    value={newKravpakkeBeskrivelse}
                    onChange={(e) => setNewKravpakkeBeskrivelse(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Skriv inn beskrivelse..."
                    disabled={isCreating}
                  />
                </div>
                {createError && (
                  <div className="text-sm text-red-600">{createError}</div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKravpakkeTittel("");
                    setNewKravpakkeBeskrivelse("");
                    setCreateError(null);
                  }}
                  disabled={isCreating}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateKravpakke}
                  disabled={isCreating || !newKravpakkeTittel.trim()}
                >
                  {isCreating ? "Oppretter..." : "Opprett"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
