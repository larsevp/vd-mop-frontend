import React from "react";
import { getProsjektKravSimple } from "../../../api/endpoints/models/prosjektKrav";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import { useQuery } from "@tanstack/react-query";

interface ProsjektKrav {
  id: number;
  tittel: string;
  beskrivelse?: string;
  parentId?: number | null;
  kravUID?: string;
  emneId?: number | null;
}

interface ProsjektKravSelectProps {
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
  onDataLoaded?: (data: ProsjektKrav[]) => void; // Callback when data is loaded
  onKravSelected?: (krav: ProsjektKrav | null) => void; // Callback when krav is selected
}

export function ProsjektKravSelect({
  name,
  label = "Parent Prosjekt Krav",
  value,
  onChange,
  placeholder = "Velg overordnet prosjektkrav...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen parent",
  className = "",
  excludeId,
  onDataLoaded,
  onKravSelected,
}: ProsjektKravSelectProps) {
  const {
    data: kravList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["prosjektKrav", "simple", excludeId],
    queryFn: getProsjektKravSimple,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    select: (response: any): ProsjektKrav[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter out:
      // 1. The current record if excludeId is provided (prevent self-reference)
      // 2. Any ProsjektKrav that already has a parentId (prevent nested hierarchy)
      const filteredData = data.filter((krav: ProsjektKrav) => {
        // Exclude current record
        if (excludeId && krav.id === excludeId) {
          return false;
        }

        // Exclude ProsjektKrav that already have a parent (keep hierarchy to one level)
        if (krav.parentId !== null && krav.parentId !== undefined) {
          return false;
        }

        return true;
      });

      // Sort by ID for consistent ordering
      return filteredData.sort((a: ProsjektKrav, b: ProsjektKrav) => a.id - b.id);
    },
  });

  // Notify when data is loaded
  React.useEffect(() => {
    if (onDataLoaded && kravList.length > 0) {
      onDataLoaded(kravList);
    }
  }, [kravList, onDataLoaded]);

  const handleValueChange = (event: { target: { name?: string; value: string | null; type: string } }) => {
    const numericValue = event.target.value === null ? null : parseInt(event.target.value, 10);
    
    // Find the selected krav for the callback
    const selectedKrav = numericValue ? kravList.find(k => k.id === numericValue) || null : null;
    
    // Call the selection callback
    if (onKravSelected) {
      onKravSelected(selectedKrav);
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

  // Convert krav list to ComboBox options with PK[id] - Tittel format
  const options: ComboBoxOption[] = React.useMemo(() => {
    return kravList.map((krav: ProsjektKrav) => ({
      id: krav.id.toString(),
      label: `${krav.kravUID || `PK${krav.id}`} - ${krav.tittel}`,
    }));
  }, [kravList]);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value ? value.toString() : null}
      onChange={handleValueChange}
      placeholder={isLoading ? "Laster prosjektkrav..." : placeholder}
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