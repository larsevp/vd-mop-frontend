import React from "react";
import { useQuery } from "@tanstack/react-query";

interface EntitySelectProps {
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  queryKey: string[];
  queryFn: () => Promise<any>;
  displayField: "navn" | "tittel"; // Field to show in options
  sortField?: string; // Field to sort by (defaults to displayField)
  allowEmpty?: boolean; // Allow "None" option
  emptyLabel?: string; // Label for empty option
}

export default function EntitySelect_old({
  label,
  value,
  onChange,
  placeholder = "Velg...",
  required = false,
  disabled = false,
  className = "",
  queryKey,
  queryFn,
  displayField,
  sortField,
  allowEmpty = false,
  emptyLabel = "Ingen",
}: EntitySelectProps) {
  const {
    data: entities = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn,
    select: (res) => res?.data || [],
  });

  // Sort entities
  const sortedEntities = [...entities].sort((a, b) => {
    const fieldToSort = sortField || displayField;
    if (fieldToSort === "sortIt") {
      return (a.sortIt || 0) - (b.sortIt || 0);
    }
    return (a[fieldToSort] || "").localeCompare(b[fieldToSort] || "");
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === "" ? null : parseInt(selectedValue));
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={disabled || isLoading}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{isLoading ? "Laster..." : placeholder}</option>
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {sortedEntities.map((entity) => (
          <option key={entity.id} value={entity.id}>
            {entity[displayField]}
          </option>
        ))}
      </select>
      {isError && <p className="mt-1 text-sm text-red-600">Kunne ikke laste data. Prøv igjen senere.</p>}
    </div>
  );
}
