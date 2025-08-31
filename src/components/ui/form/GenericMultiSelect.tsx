import React from "react";
import { useQuery } from "@tanstack/react-query";
import MultiSelect from "./MultiSelect";

interface Option {
  value: string | number;
  label: string;
  description?: string; // Optional description for tooltips/hover
}

interface GenericMultiSelectProps {
  selectedValues: (string | number)[];
  onSelectionChange: (values: (string | number)[]) => void;
  disabled?: boolean;
  className?: string;
  apiEndpoint: () => Promise<any>; // Function that returns a promise with data
  valueField?: string; // Field to use for value (default: 'id')
  labelField?: string; // Field to use for label (default: 'tittel')
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  customLabelFormatter?: (item: any) => string; // Custom function to format labels
  descriptionField?: string; // Field to use for description/tooltip
  onDataLoaded?: (data: any[]) => void; // Callback when API data is loaded
}

export function GenericMultiSelect({
  selectedValues,
  onSelectionChange,
  disabled = false,
  className,
  apiEndpoint,
  valueField = "id",
  labelField = "tittel",
  placeholder = "Velg elementer...",
  searchPlaceholder = "Søk...",
  emptyMessage = "Ingen elementer funnet.",
  loadingMessage = "Laster...",
  customLabelFormatter,
  descriptionField,
  onDataLoaded,
}: GenericMultiSelectProps) {
  // Create a unique query key based on the API endpoint function name and field config
  const queryKey = ["multiselect", apiEndpoint.name || "unknown", valueField, labelField];

  const {
    data: options = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiEndpoint();
      const data = response?.data || response || [];
      //console.log(data);

      // Notify parent component that data is loaded
      if (onDataLoaded) {
        onDataLoaded(data);
      }

      return data;
    },
    staleTime: 1000, // 1 second - fresh for 1 second
    select: (data: any[]): Option[] => {
      return data.map((item: any) => {
        // Use custom label formatter if provided, otherwise use the labelField
        const label = customLabelFormatter ? customLabelFormatter(item) : item[labelField] || `Item ${item[valueField]}`;

        // Include description if descriptionField is specified
        const description = descriptionField && item[descriptionField] ? item[descriptionField] : undefined;

        return {
          value: item[valueField],
          label,
          description,
        };
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-md">
        <span className="text-sm text-muted-foreground">{loadingMessage}</span>
      </div>
    );
  }

  if (error) {
    console.error("Error fetching data for multiselect:", error);
    return (
      <div className="flex items-center justify-center p-4 border rounded-md border-red-200">
        <span className="text-sm text-red-600">Feil ved lasting av data</span>
      </div>
    );
  }

  return (
    <MultiSelect
      options={options}
      selectedValues={selectedValues}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      disabled={disabled}
      className={className}
    />
  );
}

export default GenericMultiSelect;
