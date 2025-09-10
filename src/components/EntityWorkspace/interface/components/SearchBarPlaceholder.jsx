/**
 * SearchBarPlaceholder - Generic search container for the interface layer
 *
 * This component provides a fallback search implementation and acts as a container
 * for domain-specific search components passed via render props.
 */

import React, { useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";

const SearchBarPlaceholder = ({
  // Basic search props
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  isLoading = false,
  placeholder = "Søk...",

  // Render prop for domain-specific implementation
  renderSearchBar = null,

  // Pass-through props for domain search component
  ...additionalProps
}) => {
  const searchRef = useRef(null);

  // If domain provides a custom search component, use it
  if (renderSearchBar) {
    return renderSearchBar({
      searchInput,
      onSearchInputChange,
      onSearch,
      onClearSearch,
      isLoading,
      placeholder,
      searchRef,
      ...additionalProps,
    });
  }

  // Fallback: Simple search implementation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        onSearch();
        break;
      case "Escape":
        if (searchInput) {
          onClearSearch();
        } else {
          searchRef.current?.blur();
        }
        break;
    }
  };

  return (
    <div className="flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          ref={searchRef}
          type="text"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
          {searchInput && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearSearch} className="h-6 w-6 p-0 hover:bg-neutral-100">
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSearch}
            className="h-6 px-2 text-xs hover:bg-neutral-100"
            disabled={isLoading}
          >
            Søk
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBarPlaceholder;
