import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFagomraderSimple } from "@/api/endpoints";
import { ComboBox } from "@/components/ui/form/ComboBox";
import { Check } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";

/**
 * FagomradeSelect for functional area selection using ComboBox
 * Features:
 * - Icon and color display for each fagområde
 * - Loading and error states
 * - Integration with form validation
 * - Built on ComboBox component for consistency
 */
export default function FagomradeSelect({
  name,
  value,
  onChange,
  label,
  required = false,
  placeholder = "Velg fagområde...",
  className = ""
}) {
  const {
    data: fagomrader = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fagomrader"],
    queryFn: getFagomraderSimple,
    select: (response) => {
      // Handle both direct array and response.data patterns
      const data = Array.isArray(response) ? response : response.data || [];
      return data;
    },
  });

  // Convert fagomrader to ComboBox options with icon and color data
  const fagomradeOptions = React.useMemo(() => {
    if (!fagomrader.length) return [];

    return fagomrader
      .sort((a, b) => {
        // Sort by sortIt if available, otherwise by tittel
        if (a.sortIt !== undefined && b.sortIt !== undefined) {
          return a.sortIt - b.sortIt;
        }
        return (a.tittel || "").localeCompare(b.tittel || "");
      })
      .map((fagomrade) => ({
        id: fagomrade.id.toString(),
        label: fagomrade.tittel || `ID: ${fagomrade.id}`,
        icon: fagomrade.icon,
        color: fagomrade.color,
      }));
  }, [fagomrader]);

  // Handle selection and convert to number value
  const handleChange = React.useCallback(
    (event) => {
      const newValue = event.target.value ? parseInt(event.target.value, 10) : null;
      onChange({
        target: {
          name,
          value: newValue,
          type: "select",
        },
      });
    },
    [name, onChange]
  );

  // Custom render function for options with icons
  const renderFagomradeOption = React.useCallback((option, isSelected, isActive) => {
    const iconName = option.icon;
    const color = option.color || "#6b7280"; // Default gray if no color

    return (
      <>
        <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
        <div className="flex items-center flex-1 min-w-0 gap-2">
          {/* Colored circle with white icon */}
          {iconName && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              <div className="text-white">
                <DynamicIcon name={iconName} size={12} color="white" />
              </div>
            </div>
          )}
          <span className={cn("truncate text-sm", isActive ? "text-accent-foreground" : "text-foreground")}>
            {option.label}
          </span>
        </div>
      </>
    );
  }, []);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value?.toString() || null}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={false}
      className={className}
      allowEmpty={true}
      emptyLabel="Ingen fagområde"
      options={fagomradeOptions}
      isLoading={isLoading}
      error={error?.message || null}
      renderOption={renderFagomradeOption}
    />
  );
}
