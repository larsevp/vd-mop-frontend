import React, { useState, useEffect } from "react";
import MultiSelect from "./MultiSelect";

interface Option {
  value: string | number;
  label: string;
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
}: GenericMultiSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiEndpoint();

        // Transform the data to the expected format
        const transformedOptions = response.data.map((item: any) => ({
          value: item[valueField],
          label: item[labelField] || `Item ${item[valueField]}`,
        }));

        setOptions(transformedOptions);
      } catch (error) {
        console.error("Error fetching data for multiselect:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiEndpoint, valueField, labelField]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-md">
        <span className="text-sm text-muted-foreground">{loadingMessage}</span>
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
