import React from "react";
import { useQuery } from "@tanstack/react-query";

interface EntityCheckboxGroupProps {
  label: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  queryKey: string[];
  queryFn: () => Promise<any>;
  displayField: "navn" | "tittel"; // Field to show in options
  sortField?: string; // Field to sort by (defaults to displayField)
  layout?: "vertical" | "horizontal" | "grid"; // Layout options
  columns?: number; // For grid layout
}

export default function EntityCheckboxGroup({
  label,
  selectedValues,
  onChange,
  disabled = false,
  className = "",
  queryKey,
  queryFn,
  displayField,
  sortField,
  layout = "vertical",
  columns = 3,
}: EntityCheckboxGroupProps) {
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

  const handleChange = (entityId: number, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, entityId]);
    } else {
      onChange(selectedValues.filter((id) => id !== entityId));
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case "horizontal":
        return "flex flex-wrap gap-4";
      case "grid":
        return `grid grid-cols-${columns} gap-2`;
      default:
        return "space-y-2";
    }
  };

  if (isLoading) {
    return (
      <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="text-sm text-gray-500">Laster...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="text-sm text-red-600">Kunne ikke laste data. Prøv igjen senere.</div>
      </div>
    );
  }

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className={getLayoutClasses()}>
        {sortedEntities.map((entity) => (
          <label key={entity.id} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(entity.id)}
              onChange={(e) => handleChange(entity.id, e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700">{entity[displayField]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
