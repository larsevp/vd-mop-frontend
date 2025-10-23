import React from "react";
import { getKravSimple } from "../../../api/endpoints/models/krav";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import { useQuery } from "@tanstack/react-query";

interface Krav {
  id: number;
  tittel: string;
  beskrivelse?: string;
  parentId?: number | null;
}

interface KravSelectProps {
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
}

export function KravSelect({
  name,
  label = "Parent Krav",
  value,
  onChange,
  placeholder = "Velg parent krav...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen",
  className = "",
  excludeId,
}: KravSelectProps) {
  const {
    data: kravList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["krav", "multiselect", excludeId], // More specific key to prevent conflicts
    queryFn: getKravSimple,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    select: (response: any): Krav[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter out:
      // 1. The current record if excludeId is provided (prevent self-reference)
      // 2. Any Krav that already has a parentId (prevent nested hierarchy)
      const filteredData = data.filter((krav: Krav) => {
        // Exclude current record
        if (excludeId && krav.id === excludeId) {
          return false;
        }

        // Exclude Krav that already have a parent (keep hierarchy to one level)
        if (krav.parentId !== null && krav.parentId !== undefined) {
          return false;
        }

        return true;
      });

      // Sort by ID for consistent ordering
      return filteredData.sort((a: Krav, b: Krav) => a.id - b.id);
    },
  });

  const handleValueChange = (event: { target: { name?: string; value: string | null; type: string } }) => {
    const numericValue = event.target.value === null ? null : parseInt(event.target.value, 10);
    onChange({
      target: {
        name,
        value: numericValue,
        type: "select",
      },
    });
  };

  // Convert krav list to ComboBox options with K[id] - Tittel format
  const options: ComboBoxOption[] = React.useMemo(() => {
    return kravList.map((krav: Krav) => ({
      id: krav.id.toString(),
      label: `K${krav.id} - ${krav.tittel}`,
    }));
  }, [kravList]);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value ? value.toString() : null}
      onChange={handleValueChange}
      placeholder={isLoading ? "Laster krav..." : placeholder}
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
