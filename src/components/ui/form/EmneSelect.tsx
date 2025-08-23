import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getEmner } from "../../../api/endpoints/models/emne";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import EntityCheckboxGroup from "./EntityCheckboxGroup";
import { IconWithText } from "@/components/ui/DynamicIcon";

interface Emne {
  id: number;
  tittel: string;
  icon?: string;
  color?: string;
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
}: EmneSelectProps) {
  const {
    data: emneList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["emner"],
    queryFn: getEmner,
    select: (response: any): Emne[] => {
      const data = Array.isArray(response) ? response : response.data || [];
      return data.sort((a: Emne, b: Emne) => {
        const aNavn = a.tittel || "";
        const bNavn = b.tittel || "";
        return aNavn.localeCompare(bNavn);
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
      error={error instanceof Error ? error.message : error ? String(error) : null}
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
