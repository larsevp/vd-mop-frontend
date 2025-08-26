import React from "react";
import { getTiltakSimple } from "../../../api/endpoints/models/tiltak";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import { useQuery } from "@tanstack/react-query";

interface Tiltak {
  id: number;
  tittel: string;
  tiltakUID: string;
  beskrivelse?: string;
  parentId?: number | null;
}

interface TiltakSelectProps {
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

export function TiltakSelect({
  name,
  label = "Overordnet tiltak",
  value,
  onChange,
  placeholder = "Velg overordnet tiltak...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Ingen overordnet tiltak",
  className = "",
  excludeId,
}: TiltakSelectProps) {
  const {
    data: tiltakList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tiltak", "multiselect", excludeId], // More specific key to prevent conflicts
    queryFn: getTiltakSimple,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    select: (response: any): Tiltak[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter out:
      // 1. The current record if excludeId is provided (prevent self-reference)
      // 2. Any Tiltak that already has a parentId (prevent nested hierarchy)
      const filteredData = data.filter((tiltak: Tiltak) => {
        // Exclude current record
        if (excludeId && tiltak.id === excludeId) {
          return false;
        }

        // Exclude Tiltak that already have a parent (keep hierarchy to one level)
        if (tiltak.parentId !== null && tiltak.parentId !== undefined) {
          return false;
        }

        return true;
      });

      // Sort by ID for consistent ordering
      return filteredData.sort((a: Tiltak, b: Tiltak) => a.id - b.id);
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

  // Convert tiltak list to ComboBox options with GT[tiltakUID] - Tittel format
  const options: ComboBoxOption[] = React.useMemo(() => {
    return tiltakList.map((tiltak: Tiltak) => ({
      id: tiltak.id.toString(),
      label: `${tiltak.tiltakUID} - ${tiltak.tittel}`,
    }));
  }, [tiltakList]);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value ? value.toString() : null}
      onChange={handleValueChange}
      placeholder={isLoading ? "Laster tiltak..." : placeholder}
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
