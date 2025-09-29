import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getEmnerSimple as getEmner } from "../../../api/endpoints/models/emne";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import EntityCheckboxGroup from "./EntityCheckboxGroup";
import { IconWithText } from "@/components/ui/DynamicIcon";

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

  return (
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
