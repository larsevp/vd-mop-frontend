import React from "react";
import { ComboBox, ComboBoxOption } from "./ComboBox";
import { Triangle } from "lucide-react";
import { getPriorityOptions } from "@/pages/KravTiltak/shared/config/priorityConfig";

interface PrioritetSelectProps {
  name?: string;
  label?: string; // Kept for backwards compatibility, but not rendered
  value?: number | null;
  onChange: (event: { target: { name?: string; value: number | null; type: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

// Priority mapping: Use centralized config
export const PRIORITY_OPTIONS = getPriorityOptions();

// Helper function to get label from value
export const getPriorityLabel = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "Ikke satt";
  const option = PRIORITY_OPTIONS.find((opt) => opt.value === value);
  return option ? option.label : ` ${value}`;
};

// Helper function to get value from label
export const getPriorityValue = (label: string): number | null => {
  const option = PRIORITY_OPTIONS.find((opt) => opt.label === label);
  return option ? option.value : null;
};

// Helper function to collapse any value into the closest bucket
export const collapseToNearestBucket = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;

  // Map values to closest bucket:
  // 1-9: Lav (5)
  // 10-19: Middels (15)
  // 20+: Høy (25)
  if (value < 10) return 15;
  if (value < 25) return 25;
  return 15;
};

export function PrioritetSelect({
  name,
  label = "Prioritet", // Will not be rendered by ComboBox
  value,
  onChange,
  placeholder = "Velg prioritet...",
  required = false,
  disabled = false,
  className = "",
  allowEmpty = true,
  emptyLabel = "Ikke satt",
}: PrioritetSelectProps) {
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

  // Convert priority options to ComboBox options
  const options: ComboBoxOption[] = React.useMemo(() => {
    return PRIORITY_OPTIONS.map((option) => ({
      id: option.value.toString(),
      label: option.label,
      icon: 'Triangle', // Use string name for ComboBox icon overlay
      iconRotation: option.iconRotation,
      color: option.color,
    }));
  }, []);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value ? value.toString() : null}
      onChange={handleValueChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      options={options}
      isLoading={false}
      error={null}
      renderOption={(option, isSelected, isActive) => {
        return (
          <span className="flex items-center gap-2">
            <Triangle
              size={16}
              className={option.iconRotation}
              style={{ color: option.color }}
            />
            <span>{option.label}</span>
          </span>
        );
      }}
    />
  );
}
