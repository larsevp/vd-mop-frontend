import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLoverSimple as getLover, createLov } from "../../../api/endpoints/models/lov";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import GenericMultiSelect from "./GenericMultiSelect";
import { Button } from "../primitives/button";
import { Plus, X } from "lucide-react";

interface Lov {
  id: number;
  tittel: string;
}

interface LovSelectProps {
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

interface LovCheckboxGroupProps {
  label?: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function LovSelect({
  name,
  label = "Lover og forskrifter",
  value,
  onChange,
  placeholder = "Søk eller velg lov/forskrift...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen lov/forskrift",
  className = "",
  error: validationError,
  availableIds,
}: LovSelectProps) {
  const queryClient = useQueryClient();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLovTittel, setNewLovTittel] = useState("");
  const [newLovBeskrivelse, setNewLovBeskrivelse] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: loverList = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["lover"],
    queryFn: getLover,
    select: (response: any): Lov[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter by available IDs if provided
      let filteredData = data;
      if (availableIds && availableIds.length > 0) {
        filteredData = data.filter((item: Lov) => availableIds.includes(item.id));
      }

      // Sort by tittel
      return filteredData.sort((a: Lov, b: Lov) => {
        return (a.tittel || "").localeCompare(b.tittel || "");
      });
    },
  });

  // Convert Lov[] to ComboBoxOption[]
  const options: ComboBoxOption[] = React.useMemo(() => {
    return loverList.map((lov) => ({
      id: lov.id.toString(),
      label: lov.tittel || `Lov ${lov.id}`,
    }));
  }, [loverList]);

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

  // Handle create new lov
  const handleCreateLov = async () => {
    if (!newLovTittel.trim()) {
      setCreateError("Tittel er påkrevd");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await createLov({
        tittel: newLovTittel.trim(),
        beskrivelse: newLovBeskrivelse.trim() || undefined,
      });

      // Extract the created lov ID
      const createdLov = result?.data || result;
      const newLovId = createdLov?.id;

      // Invalidate and refetch lover list
      // Invalidate all lover queries (including GenericMultiSelect's dynamic query key)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "lover" ||
                 (key[0] === "multiselect" && typeof key[1] === "string" && key[1].includes("Lover"));
        }
      });

      // Update the form field with the new lov
      if (newLovId) {
        onChange({
          target: {
            name,
            value: newLovId,
            type: "select",
          },
        });
      }

      // Close modal and reset
      setShowCreateModal(false);
      setNewLovTittel("");
      setNewLovBeskrivelse("");
    } catch (error: any) {
      console.error("Failed to create lov:", error);
      // Check for unique constraint error
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        const tittelError = details.find((d: any) => d.field === "tittel");
        setCreateError(tittelError?.message || "Kunne ikke opprette lov/forskrift");
      } else {
        setCreateError(error instanceof Error ? error.message : "Kunne ikke opprette lov/forskrift");
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
          title="Opprett ny lov/forskrift"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Lov Modal - Custom portal with z-[110] to appear above flow detail modal (z-[100]) */}
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
                <h2 className="text-lg font-semibold">Opprett ny lov/forskrift</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewLovTittel("");
                    setNewLovBeskrivelse("");
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
                  <label htmlFor="lov-tittel" className="text-sm font-medium">
                    Tittel <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lov-tittel"
                    type="text"
                    value={newLovTittel}
                    onChange={(e) => setNewLovTittel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="F.eks. Plan- og bygningsloven, Arbeidsmiljøloven..."
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="lov-beskrivelse" className="text-sm font-medium">
                    Beskrivelse
                  </label>
                  <textarea
                    id="lov-beskrivelse"
                    value={newLovBeskrivelse}
                    onChange={(e) => setNewLovBeskrivelse(e.target.value)}
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
                    setNewLovTittel("");
                    setNewLovBeskrivelse("");
                    setCreateError(null);
                  }}
                  disabled={isCreating}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateLov}
                  disabled={isCreating || !newLovTittel.trim()}
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

export function LovCheckboxGroup({
  selectedValues,
  onChange,
  disabled,
  placeholder,
  config,
}: any) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLovTittel, setNewLovTittel] = useState("");
  const [newLovBeskrivelse, setNewLovBeskrivelse] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateLov = async () => {
    if (!newLovTittel.trim()) {
      setCreateError("Tittel er påkrevd");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await createLov({
        tittel: newLovTittel.trim(),
        beskrivelse: newLovBeskrivelse.trim() || undefined,
      });

      const createdLov = result?.data || result;
      const newLovId = createdLov?.id;

      // Invalidate all lover queries (including GenericMultiSelect's dynamic query key)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "lover" ||
                 (key[0] === "multiselect" && typeof key[1] === "string" && key[1].includes("Lover"));
        }
      });

      // Don't auto-select - let user decide if they want to select it (industry standard for multiselect)

      setShowCreateModal(false);
      setNewLovTittel("");
      setNewLovBeskrivelse("");
    } catch (error: any) {
      console.error("Failed to create lov:", error);
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        const tittelError = details.find((d: any) => d.field === "tittel");
        setCreateError(tittelError?.message || "Kunne ikke opprette lov/forskrift");
      } else {
        setCreateError(error instanceof Error ? error.message : "Kunne ikke opprette lov/forskrift");
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
          title="Opprett ny lov/forskrift"
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
                <h2 className="text-lg font-semibold">Opprett ny lov/forskrift</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewLovTittel("");
                    setNewLovBeskrivelse("");
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
                  <label htmlFor="lov-tittel-modal" className="text-sm font-medium">
                    Tittel <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lov-tittel-modal"
                    type="text"
                    value={newLovTittel}
                    onChange={(e) => setNewLovTittel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="F.eks. Plan- og bygningsloven, Arbeidsmiljøloven..."
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="lov-beskrivelse-modal" className="text-sm font-medium">
                    Beskrivelse
                  </label>
                  <textarea
                    id="lov-beskrivelse-modal"
                    value={newLovBeskrivelse}
                    onChange={(e) => setNewLovBeskrivelse(e.target.value)}
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
                    setNewLovTittel("");
                    setNewLovBeskrivelse("");
                    setCreateError(null);
                  }}
                  disabled={isCreating}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateLov}
                  disabled={isCreating || !newLovTittel.trim()}
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
