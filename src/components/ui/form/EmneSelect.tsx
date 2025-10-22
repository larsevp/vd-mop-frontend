import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEmnerSimple as getEmner, createEmne } from "../../../api/endpoints/models/emne";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import EntityCheckboxGroup from "./EntityCheckboxGroup";
import { IconWithText } from "@/components/ui/DynamicIcon";
import { Button } from "../primitives/button";
import { Plus, X } from "lucide-react";
import { BASIC_FIELD_TYPES } from "@/components/tableComponents/fieldTypes/basicTypes";

interface Emne {
  id: number;
  tittel: string;
  icon?: string;
  color?: string;
  sortIt?: number;
}

interface EmneSelectProps {
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
  error?: string | null; // Validation error message
  // Dynamic filtering support
  availableIds?: number[]; // Optional: limit to only these IDs (for dynamic filtering)
}

interface EmneCheckboxGroupProps {
  label?: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function EmneSelect({
  name,
  label = "Emne",
  value,
  onChange,
  placeholder = "Søk eller velg emne...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen emne",
  className = "",
  error: validationError,
  availableIds,
}: EmneSelectProps) {
  const queryClient = useQueryClient();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmneTittel, setNewEmneTittel] = useState("");
  const [newEmneBeskrivelse, setNewEmneBeskrivelse] = useState("");
  const [newEmneIcon, setNewEmneIcon] = useState<string>("");
  const [newEmneColor, setNewEmneColor] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: emneList = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["emner"],
    queryFn: getEmner,
    select: (response: any): Emne[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter by available IDs if provided (for dynamic filtering)
      let filteredData = data;
      if (availableIds && availableIds.length > 0) {
        filteredData = data.filter((item: Emne) => availableIds.includes(item.id));
      }

      // Sort by sortIt first, then by id as fallback (respect backend ordering)
      return filteredData.sort((a: Emne, b: Emne) => {
        const aSortIt = a.sortIt;
        const bSortIt = b.sortIt;

        // Handle null/undefined sortIt values
        if (aSortIt === null || aSortIt === undefined) {
          if (bSortIt === null || bSortIt === undefined) {
            // Both null - sort by id
            return (a.id || 0) - (b.id || 0);
          }
          return 1; // a is null, goes after b
        }

        if (bSortIt === null || bSortIt === undefined) {
          return -1; // b is null, a goes before b
        }

        // Both have sortIt values
        if (aSortIt !== bSortIt) {
          return aSortIt - bSortIt;
        }

        // Same sortIt - sort by id as tiebreaker
        return (a.id || 0) - (b.id || 0);
      });
    },
  });

  // Convert Emne[] to ComboBoxOption[]
  const options: ComboBoxOption[] = React.useMemo(() => {
    return emneList.map((emne) => ({
      id: emne.id.toString(),
      label: emne.tittel || `Emne ${emne.id}`,
      icon: emne.icon,
      color: emne.color,
    }));
  }, [emneList]);

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

  // Handle create new emne
  const handleCreateEmne = async () => {
    if (!newEmneTittel.trim()) {
      setCreateError("Tittel er påkrevd");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await createEmne({
        tittel: newEmneTittel.trim(),
        beskrivelse: newEmneBeskrivelse.trim() || undefined,
        icon: newEmneIcon || undefined,
        color: newEmneColor || undefined,
      });

      // Extract the created emne ID
      const createdEmne = result?.data || result;
      const newEmneId = createdEmne?.id;

      // Invalidate and refetch emner list
      await queryClient.invalidateQueries({ queryKey: ["emner"] });

      // Update the form field with the new emne
      if (newEmneId) {
        onChange({
          target: {
            name,
            value: newEmneId,
            type: "select",
          },
        });
      }

      // Close modal and reset
      setShowCreateModal(false);
      setNewEmneTittel("");
      setNewEmneBeskrivelse("");
      setNewEmneIcon("");
      setNewEmneColor("");
    } catch (error) {
      console.error("Failed to create emne:", error);
      setCreateError(error instanceof Error ? error.message : "Kunne ikke opprette emne");
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
          title="Opprett nytt emne"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Emne Modal - Custom portal with z-[110] to appear above flow detail modal (z-[100]) */}
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
                <h2 className="text-lg font-semibold">Opprett nytt emne</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewEmneTittel("");
                    setNewEmneBeskrivelse("");
                    setNewEmneIcon("");
                    setNewEmneColor("");
                    setCreateError(null);
                  }}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  disabled={isCreating}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Lukk</span>
                </button>
              </div>

              {/* Form Fields - Increase z-index for popovers inside this modal */}
              <div className="grid gap-4 [&_[data-radix-popper-content-wrapper]]:z-[120]">
                <div className="grid gap-2">
                  <label htmlFor="emne-tittel" className="text-sm font-medium">
                    Tittel <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="emne-tittel"
                    type="text"
                    value={newEmneTittel}
                    onChange={(e) => setNewEmneTittel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Skriv inn emnetittel..."
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="emne-beskrivelse" className="text-sm font-medium">
                    Beskrivelse
                  </label>
                  <textarea
                    id="emne-beskrivelse"
                    value={newEmneBeskrivelse}
                    onChange={(e) => setNewEmneBeskrivelse(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Skriv inn beskrivelse..."
                    disabled={isCreating}
                  />
                </div>
                <style>{`
                  [data-radix-popper-content-wrapper] {
                    z-index: 120 !important;
                  }
                `}</style>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Ikon
                  </label>
                  {BASIC_FIELD_TYPES.icon({
                    field: { name: "icon", placeholder: "Velg ikon" },
                    value: newEmneIcon,
                    onChange: (e: any) => setNewEmneIcon(e.target.value),
                    error: null,
                  })}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Farge
                  </label>
                  {BASIC_FIELD_TYPES.color({
                    field: { name: "color", placeholder: "Velg farge..." },
                    value: newEmneColor,
                    onChange: (e: any) => setNewEmneColor(e.target.value),
                    error: null,
                  })}
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
                    setNewEmneTittel("");
                    setNewEmneBeskrivelse("");
                    setNewEmneIcon("");
                    setNewEmneColor("");
                    setCreateError(null);
                  }}
                  disabled={isCreating}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateEmne}
                  disabled={isCreating || !newEmneTittel.trim()}
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

export function EmneCheckboxGroup({ label = "Emne", layout = "vertical", ...props }: EmneCheckboxGroupProps) {
  return (
    <EntityCheckboxGroup
      {...props}
      label={label}
      queryKey={["emner"]}
      queryFn={getEmner}
      displayField="navn"
      sortField="navn"
      layout={layout}
    />
  );
}
