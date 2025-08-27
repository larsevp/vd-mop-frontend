import React from "react";
import * as LucideIcons from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStatusSimple as getStatus } from "@/api/endpoints/models/status";
import { getVurderingerSimple as getVurderinger } from "@/api/endpoints/models/vurdering";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select";

/**
 * Helper function to get Lucide icon component from string name
 */
const getLucideIcon = (iconName) => {
  if (!iconName) return LucideIcons.Circle;
  
  // Handle common icon name formats
  const normalizedName = iconName.replace(/[-_\s]/g, '').toLowerCase();
  
  // Find the icon in the Lucide exports
  const iconKey = Object.keys(LucideIcons).find(key => 
    key.toLowerCase() === normalizedName ||
    key.toLowerCase() === iconName.toLowerCase()
  );
  
  return iconKey ? LucideIcons[iconKey] : LucideIcons.Circle;
};

/**
 * Helper function to get badge styling from hex color
 */
const getBadgeClassFromColor = (color) => {
  if (!color) return "bg-gray-100 text-gray-600 border-gray-200";
  
  // Create light background and border from the hex color
  return "border-2 border-dashed"; // Let inline styles handle the colors
};

/**
 * EntityDropdown using shadcn Select component
 */
const EntityDropdown = ({ 
  type, // "status" or "vurdering"
  value, 
  onChange, 
  loading = false, 
  className = "" 
}) => {
  // Configuration based on type
  const config = {
    status: {
      queryKey: ["status"],
      queryFn: getStatus,
      nullOption: { id: null, navn: "Ikke satt", icon: "Circle", color: "#6b7280" },
      placeholder: "Ikke satt",
    },
    vurdering: {
      queryKey: ["vurderinger"], 
      queryFn: getVurderinger,
      nullOption: { id: null, navn: "Ikke vurdert", icon: "Minus", color: "#6b7280" },
      placeholder: "Ikke vurdert",
    }
  };

  const currentConfig = config[type];
  if (!currentConfig) {
    console.error(`EntityDropdown: Invalid type "${type}". Must be "status" or "vurdering"`);
    return null;
  }

  // Load options using the configured query
  const { data: apiOptions = [], isLoading: optionsLoading } = useQuery({
    queryKey: currentConfig.queryKey,
    queryFn: currentConfig.queryFn,
  });

  // Handle API response format
  const actualOptions = Array.isArray(apiOptions) ? apiOptions : apiOptions?.data || [];

  // Create options with null option - API already has icon and color
  const allOptions = [
    currentConfig.nullOption,
    ...actualOptions // API options already have icon (string) and color (hex)
  ];

  // Find current option for display
  const currentOption = allOptions.find(opt => opt.id === value) || allOptions[0];
  const CurrentIcon = currentOption ? getLucideIcon(currentOption.icon) : null;
  const isLoading = loading || optionsLoading;

  const handleValueChange = async (newValue) => {
    if (!onChange) return;
    
    // Convert string "null" back to actual null
    const actualValue = newValue === "null" ? null : parseInt(newValue, 10);
    
    try {
      await onChange(actualValue);
    } catch (error) {
      console.error(`${type} change failed:`, error);
    }
  };

  return (
    <Select 
      value={value?.toString() || "null"} 
      onValueChange={handleValueChange} 
      disabled={isLoading}
    >
      <SelectTrigger 
        className={`
          w-auto h-auto text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all duration-200
          bg-white text-black border-gray-300
          ${isLoading ? 'opacity-50' : 'hover:border-gray-400'}
          shadow-sm ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
          ) : (
            CurrentIcon && <CurrentIcon size={11} style={{ color: currentOption?.color }} />
          )}
          <span>{currentOption?.navn || currentConfig.placeholder}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {allOptions.map((option) => {
          const OptionIcon = getLucideIcon(option.icon);
          return (
            <SelectItem
              key={option.id || "null"}
              value={option.id?.toString() || "null"}
            >
              <div className="flex items-center gap-2">
                {OptionIcon && <OptionIcon size={14} style={{ color: option.color }} />}
                <span>{option.navn}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default EntityDropdown;