import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";

interface BooleanSelectProps {
  name?: string;
  label?: string;
  value?: boolean | null;
  onChange: (event: { target: { name?: string; value: boolean | null; type: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  defaultValue?: boolean;
}

export function BooleanSelect({
  name,
  label,
  value,
  onChange,
  placeholder = "Velg...",
  required = false,
  disabled = false,
  className,
  defaultValue,
}: BooleanSelectProps) {
  const handleValueChange = (selectedValue: string) => {
    let boolValue: boolean | null = null;

    if (selectedValue === "true") {
      boolValue = true;
    } else if (selectedValue === "false") {
      boolValue = false;
    }
    // If selectedValue is "null" or anything else, boolValue remains null

    onChange({
      target: {
        name,
        value: boolValue,
        type: "boolean",
      },
    });
  };

  // Convert boolean value to string for Select component
  const stringValue = value === null ? "null" : value?.toString();
  

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={className}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <Select value={stringValue} onValueChange={handleValueChange} disabled={disabled} name={name}>
        <SelectTrigger onClick={handleClick} onMouseDown={handleMouseDown}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value="null">
              <span className="text-muted-foreground">Ikke valgt</span>
            </SelectItem>
          )}
          <SelectItem value="true">Ja</SelectItem>
          <SelectItem value="false">Nei</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default BooleanSelect;
