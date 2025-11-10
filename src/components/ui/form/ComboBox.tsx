import React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/primitives/input";
import { IconWithText } from "@/components/ui/DynamicIcon";

export interface ComboBoxOption {
  id: string;
  label: string;
  depth?: number;
  hasChildren?: boolean;
  originalLabel?: string;
  icon?: string | React.ComponentType<any> | React.ReactElement;
  iconRotation?: string;
  color?: string;
}

interface ComboBoxProps {
  name?: string;
  label?: string; // Kept for backwards compatibility, but not rendered
  value?: string | null;
  onChange: (event: { target: { name?: string; value: string | null; type: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  options: ComboBoxOption[];
  isLoading?: boolean;
  error?: string | null;
  filterFn?: (option: ComboBoxOption, searchValue: string) => boolean;
  renderOption?: (option: ComboBoxOption, isSelected: boolean, isActive: boolean) => React.ReactNode;
}

export function ComboBox({
  name,
  label = "Select option", // Keep for backwards compatibility but won't be rendered
  value,
  onChange,
  placeholder = "Search or select...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "None",
  className = "",
  options = [],
  isLoading = false,
  error = null,
  filterFn = (option, searchValue) => option.label.toLowerCase().includes(searchValue.toLowerCase()),
  renderOption,
}: ComboBoxProps) {
  // If field is required, don't allow empty selection
  const effectiveAllowEmpty = required ? false : allowEmpty;
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [lastInteractionType, setLastInteractionType] = React.useState<"mouse" | "keyboard" | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectedItemRef = React.useRef<HTMLDivElement>(null);
  const highlightedItemRef = React.useRef<HTMLDivElement>(null);

  // Build stable option ids for aria-activedescendant
  const getOptionId = React.useCallback(
    (index: number) => {
      return `${listboxId}-option-${index}`;
    },
    [listboxId]
  );

  const selectedOption = options.find((option) => option.id === value);

  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return options;
    return options.filter((option) => filterFn(option, searchValue));
  }, [options, searchValue, filterFn]);

  // Get the index of the currently selected item in the filtered list
  const getSelectedItemIndex = React.useCallback(() => {
    if (value === null && effectiveAllowEmpty) return 0;

    const optionIndex = filteredOptions.findIndex((option) => option.id === value);
    return optionIndex >= 0 ? (effectiveAllowEmpty ? optionIndex + 1 : optionIndex) : -1;
  }, [value, effectiveAllowEmpty, filteredOptions]);

  // Get the currently active index
  const getActiveIndex = React.useCallback(() => {
    return highlightedIndex;
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setIsFocused(false);
        setSearchValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll to selected item and highlight it when dropdown opens
  React.useEffect(() => {
    if (open && !searchValue) {
      const selectedIndex = getSelectedItemIndex();
      if (selectedIndex >= 0) {
        setHighlightedIndex(selectedIndex);
        setLastInteractionType("keyboard");
        setTimeout(() => {
          selectedItemRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 10);
      }
    }
  }, [open, searchValue, getSelectedItemIndex]);

  // Scroll highlighted item into view during keyboard navigation
  React.useEffect(() => {
    if (highlightedIndex >= 0 && highlightedItemRef.current) {
      highlightedItemRef.current.scrollIntoView({
        behavior: "instant",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      const availableOptions: string[] = [];
      if (effectiveAllowEmpty) availableOptions.push("empty");
      availableOptions.push(...filteredOptions.map((option) => option.id));

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setOpen(false);
          setSearchValue("");
          setIsFocused(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;

        case "Tab":
          // Close dropdown immediately when tabbing away
          setOpen(false);
          setSearchValue("");
          setIsFocused(false);
          setHighlightedIndex(-1);
          break;

        case "ArrowDown":
          event.preventDefault();
          setLastInteractionType("keyboard");
          setHighlightedIndex((prev) => {
            if (prev < 0) return 0;
            return prev < availableOptions.length - 1 ? prev + 1 : 0;
          });
          break;

        case "ArrowUp":
          event.preventDefault();
          setLastInteractionType("keyboard");
          setHighlightedIndex((prev) => {
            if (prev < 0) return availableOptions.length - 1;
            return prev > 0 ? prev - 1 : availableOptions.length - 1;
          });
          break;

        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < availableOptions.length) {
            handleSelect(availableOptions[highlightedIndex]);
          } else if (filteredOptions.length === 1) {
            handleSelect(filteredOptions[0].id);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, highlightedIndex, filteredOptions, effectiveAllowEmpty, getSelectedItemIndex]);

  // Reset state when search changes
  React.useEffect(() => {
    setHighlightedIndex(-1);
    setLastInteractionType(null);
  }, [searchValue]);

  // Mouse interaction handlers
  const handleMouseEnter = (index: number) => {
    setLastInteractionType("mouse");
    setHighlightedIndex(index);
  };

  const handleDropdownMouseLeave = () => {
    // Only reset highlighting if we're not about to click an item
    // Use a small delay to allow click events to process first
    setTimeout(() => {
      if (lastInteractionType === "mouse") {
        setHighlightedIndex(-1);
      }
    }, 100);
  };

  // Auto-select when there's only one match
  React.useEffect(() => {
    if (searchValue.trim() && filteredOptions.length === 1 && open) {
      setHighlightedIndex(effectiveAllowEmpty ? 1 : 0);
    }
  }, [searchValue, filteredOptions, effectiveAllowEmpty, open]);

  const handleSelect = (selectedValue: string) => {
    const finalValue = selectedValue === "empty" ? null : selectedValue;
    onChange({
      target: {
        name,
        value: finalValue,
        type: "select",
      },
    });
    setOpen(false);
    setSearchValue("");
    setHighlightedIndex(-1);
    setLastInteractionType(null);
    inputRef.current?.blur();
  };

  // Render individual dropdown item
  const renderDropdownItem = (item: { id: string; label: string; isSelected: boolean; option?: ComboBoxOption }, index: number) => {
    const isActive = getActiveIndex() === index;

    // Use custom render function if provided
    if (renderOption && item.option) {
      return (
        <div
          key={item.id}
          ref={(el) => {
            if (item.isSelected) selectedItemRef.current = el;
            if (isActive) highlightedItemRef.current = el;
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSelect(item.id);
          }}
          onMouseDown={(e) => {
            // Prevent the onBlur from firing when clicking on an option
            e.preventDefault();
          }}
          onMouseEnter={() => handleMouseEnter(index)}
          id={getOptionId(index)}
          role="option"
          aria-selected={isActive}
          className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          {renderOption(item.option, item.isSelected, isActive)}
        </div>
      );
    }

    // Default rendering
    return (
      <div
        key={item.id}
        ref={(el) => {
          if (item.isSelected) selectedItemRef.current = el;
          if (isActive) highlightedItemRef.current = el;
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSelect(item.id);
        }}
        onMouseDown={(e) => {
          // Prevent the onBlur from firing when clicking on an option
          e.preventDefault();
        }}
        onMouseEnter={() => handleMouseEnter(index)}
        id={getOptionId(index)}
        role="option"
        aria-selected={isActive}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Check className={cn("mr-2 h-4 w-4", item.isSelected ? "opacity-100" : "opacity-0")} />
        {item.option?.icon ? (
          <IconWithText
            iconName={item.option.icon}
            text={item.label}
            iconColor={item.option.color}
            iconRotation={item.option.iconRotation}
            className={cn("flex-1", isActive ? "text-accent-foreground" : "text-foreground")}
          />
        ) : (
          <span className={cn("flex-1", isActive ? "text-accent-foreground" : "text-foreground")}>{item.label}</span>
        )}
      </div>
    );
  };

  return (
    <div className={className} ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined}
            aria-autocomplete="list"
            className={cn("w-full pr-10", selectedOption?.icon && !isFocused && !searchValue ? "pl-8" : "", className)}
            placeholder={isLoading ? "Loading..." : placeholder}
            value={
              isFocused || searchValue
                ? searchValue
                : selectedOption
                ? selectedOption.label
                : value === null && effectiveAllowEmpty
                ? emptyLabel
                : ""
            }
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (!open) setOpen(true);
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from propagating to parent form
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                if (open) {
                  // Dropdown is open - handle selection like the global handler would
                  const availableOptions: string[] = [];
                  if (effectiveAllowEmpty) availableOptions.push("empty");
                  availableOptions.push(...filteredOptions.map((option) => option.id));

                  if (highlightedIndex >= 0 && highlightedIndex < availableOptions.length) {
                    handleSelect(availableOptions[highlightedIndex]);
                  } else if (filteredOptions.length === 1) {
                    handleSelect(filteredOptions[0].id);
                  }
                } else if (filteredOptions.length > 0) {
                  // Dropdown is closed - select first matching option
                  handleSelect(filteredOptions[0].id);
                }
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              setOpen(true);
            }}
            onBlur={(e) => {
              // Close immediately on tab or if focus moves outside
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (!containerRef.current?.contains(relatedTarget)) {
                setIsFocused(false);
                setOpen(false);
                setSearchValue("");
              }
            }}
            disabled={isLoading || disabled}
          />

          {/* Icon overlay when not focused and option has icon */}
          {selectedOption?.icon && !isFocused && !searchValue && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <IconWithText
                iconName={selectedOption.icon}
                text=""
                iconSize={16}
                iconColor={selectedOption.color}
                iconRotation={selectedOption.iconRotation}
                className="text-foreground"
              />
            </div>
          )}

          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedOption && !searchValue && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect("empty");
                  setSearchValue("");
                }}
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>

        {open && (
          <div
            className="absolute z-50 w-full mt-2 rounded-md border bg-popover p-0 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            onMouseLeave={handleDropdownMouseLeave}
          >
            <div className="rounded-md bg-popover">
              <div id={listboxId} role="listbox" className="max-h-[200px] min-h-[100px] overflow-y-auto overflow-x-hidden p-1">
                {effectiveAllowEmpty && renderDropdownItem({ id: "empty", label: emptyLabel, isSelected: value === null }, 0)}
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Ingen elementer funnet.</div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const itemIndex = effectiveAllowEmpty ? index + 1 : index;
                    return renderDropdownItem(
                      {
                        id: option.id,
                        label: option.label,
                        isSelected: value === option.id,
                        option: option,
                      },
                      itemIndex
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">Error loading options: {error}</p>}
    </div>
  );
}
