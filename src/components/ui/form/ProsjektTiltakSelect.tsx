import React from "react";
import { getProsjektTiltakSimple } from "../../../api/endpoints/models/prosjektTiltak";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProjectStore } from "../../../stores/userStore";

interface ProsjektTiltak {
  id: number;
  tittel: string;
  beskrivelse?: string;
  parentId?: number | null;
  tiltakUID?: string;
  emneId?: number | null;
}

interface ProsjektTiltakSelectProps {
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
  excludeId?: number; // ID to exclude from the options (current record)
  onDataLoaded?: (data: ProsjektTiltak[]) => void; // Callback when data is loaded
  onTiltakSelected?: (tiltak: ProsjektTiltak | null) => void; // Callback when tiltak is selected
  projectId?: number; // Optional explicit projectId prop
}

export function ProsjektTiltakSelect({
  name,
  label = "Parent Prosjekt Tiltak",
  value,
  onChange,
  placeholder = "Velg overordnet prosjekttiltak...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen",
  className = "",
  excludeId,
  onDataLoaded,
  onTiltakSelected,
  projectId: propProjectId,
}: ProsjektTiltakSelectProps) {
  const { currentProject } = useProjectStore();

  // Use prop projectId if provided, otherwise fallback to store
  const projectId = propProjectId || currentProject?.id;
  const queryClient = useQueryClient();

  // Clear old cache entries when project changes
  React.useEffect(() => {
    // Remove old cache entries that don't include projectId (legacy cache)
    queryClient.removeQueries({
      queryKey: ["prosjektTiltak", "simple"],
      exact: false,
    });
  }, [projectId, queryClient]);

  const {
    data: tiltakList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["prosjektTiltak", "simple", projectId, excludeId],
    queryFn: () => getProsjektTiltakSimple(projectId),
    enabled: !!projectId, // Only run query if we have a project
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    select: (response: any): ProsjektTiltak[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter out:
      // 1. The current record if excludeId is provided (prevent self-reference)
      // 2. Any ProsjektTiltak that already has a parentId (prevent nested hierarchy)
      const filteredData = data.filter((tiltak: ProsjektTiltak) => {
        // Exclude current record
        if (excludeId && tiltak.id === excludeId) {
          return false;
        }

        // Exclude ProsjektTiltak that already have a parent (keep hierarchy to one level)
        if (tiltak.parentId !== null && tiltak.parentId !== undefined) {
          return false;
        }

        return true;
      });

      // Sort by ID for consistent ordering
      return filteredData.sort((a: ProsjektTiltak, b: ProsjektTiltak) => a.id - b.id);
    },
  });

  // Notify when data is loaded
  React.useEffect(() => {
    if (onDataLoaded && tiltakList.length > 0) {
      onDataLoaded(tiltakList);
    }
  }, [tiltakList, onDataLoaded]);

  const handleValueChange = (event: { target: { name?: string; value: string | null; type: string } }) => {
    const numericValue = event.target.value === null ? null : parseInt(event.target.value, 10);

    // Find the selected tiltak for the callback
    const selectedTiltak = numericValue ? tiltakList.find((t) => t.id === numericValue) || null : null;

    // Call the selection callback
    if (onTiltakSelected) {
      onTiltakSelected(selectedTiltak);
    }

    // Call the form onChange
    onChange({
      target: {
        name,
        value: numericValue,
        type: "select",
      },
    });
  };

  // Convert tiltak list to ComboBox options with PT[id] - Tittel format
  const options: ComboBoxOption[] = React.useMemo(() => {
    return tiltakList.map((tiltak: ProsjektTiltak) => ({
      id: tiltak.id.toString(),
      label: `${tiltak.tiltakUID || `PT${tiltak.id}`} - ${tiltak.tittel}`,
    }));
  }, [tiltakList]);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value ? value.toString() : null}
      onChange={handleValueChange}
      placeholder={isLoading ? "Laster prosjekttiltak..." : placeholder}
      required={required}
      disabled={isLoading || disabled}
      className={className}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      options={options}
      isLoading={isLoading}
      error={error?.message || null}
    />
  );
}
