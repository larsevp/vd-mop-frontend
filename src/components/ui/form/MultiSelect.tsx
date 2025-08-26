import React, { useState, useEffect } from "react";
import { X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/primitives/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/primitives/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover";
import { Badge } from "@/components/ui/primitives/badge";

interface Option {
  value: string | number;
  label: string;
  description?: string; // Optional description for tooltips
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: (string | number)[];
  onSelectionChange: (values: (string | number)[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayCount?: number;
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
  maxDisplayCount = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()));

  const handleSelect = (optionValue: string | number) => {
    const isSelected = selectedValues.includes(optionValue);

    if (isSelected) {
      onSelectionChange(selectedValues.filter((value) => value !== optionValue));
    } else {
      onSelectionChange([...selectedValues, optionValue]);
    }
  };

  const handleRemove = (optionValue: string | number) => {
    onSelectionChange(selectedValues.filter((value) => value !== optionValue));
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }

    // Show count instead of names to avoid duplication with badges below
    if (selectedOptions.length === 1) {
      return `${selectedOptions.length} valgt element`;
    }

    return `${selectedOptions.length} valgte elementer`;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between text-left font-normal", selectedValues.length === 0 && "text-muted-foreground")}
            disabled={disabled}
          >
            <span className="truncate">{displayText()}</span>
            <div className="flex items-center gap-2">
              {selectedValues.length > 0 && (
                <div
                  className="h-4 w-4 p-0 hover:bg-muted rounded cursor-pointer flex items-center justify-center"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const optionContent = (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {option.description.length > 60 ? `${option.description.substring(0, 60)}...` : option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );

                return optionContent;
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items as badges */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="text-xs">
              {option.label}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRemove(option.value);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleRemove(option.value)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
