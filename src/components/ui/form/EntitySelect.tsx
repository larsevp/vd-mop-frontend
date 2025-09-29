import React from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import { IconWithText } from "@/components/ui/DynamicIcon";

interface EntityWithIcon {
  id: number;
  navn?: string;
  tittel?: string;
  icon?: string;
  color?: string;
  sortIt?: number;
}

interface EntitySelectProps<T extends EntityWithIcon> {
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
  // Entity-specific configuration
  queryKey: string[];
  queryFn: () => Promise<any>;
  displayField: "navn" | "tittel"; // Which field to use for display text
  sortField?: "sortIt" | "navn" | "tittel"; // How to sort the options
  entityName: string; // For fallback display (e.g., "Status", "Vurdering")
  // Dynamic filtering support
  availableIds?: number[]; // Optional: limit to only these IDs (for dynamic filtering)
}

export function EntitySelect<T extends EntityWithIcon>({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel,
  className = "",
  queryKey,
  queryFn,
  displayField,
  sortField,
  entityName,
  availableIds,
}: EntitySelectProps<T>) {
  const {
    data: entityList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn,
    select: (response: any): T[] => {
      const data = Array.isArray(response) ? response : response.data || [];

      // Filter by available IDs if provided (for dynamic filtering)
      let filteredData = data;
      if (availableIds && availableIds.length > 0) {
        filteredData = data.filter((item: T) => availableIds.includes(item.id));
      }

      // Sort the filtered data based on sortField
      if (sortField === "sortIt") {
        return filteredData.sort((a: T, b: T) => (a.sortIt || 0) - (b.sortIt || 0));
      } else if (sortField === "navn" || sortField === "tittel") {
        return filteredData.sort((a: T, b: T) => {
          const aText = a[sortField] || "";
          const bText = b[sortField] || "";
          return aText.localeCompare(bText);
        });
      }

      return filteredData;
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

  // Convert entity list to ComboBox options
  const options: ComboBoxOption[] = React.useMemo(() => {
    return entityList.map((entity: T) => ({
      id: entity.id.toString(),
      label: entity[displayField] || `${entityName} ${entity.id}`,
      icon: entity.icon,
      color: entity.color,
    }));
  }, [entityList, displayField, entityName]);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value ? value.toString() : null}
      onChange={handleValueChange}
      placeholder={isLoading ? `Laster ${entityName.toLowerCase()}...` : placeholder}
      required={required}
      disabled={isLoading || disabled}
      className={className}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      options={options}
      isLoading={isLoading}
      error={error?.message || null}
      renderOption={(option, isSelected, isActive) => (
        <IconWithText iconName={option.icon} text={option.label} iconSize={16} iconColor={option.color} />
      )}
    />
  );
}
