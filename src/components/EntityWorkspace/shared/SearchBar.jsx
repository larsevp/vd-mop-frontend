import React from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Search, X, Loader2 } from "lucide-react";

/**
 * Generic SearchBar component for searching entities
 * Uses button-triggered search to avoid performance issues with live search
 */
const SearchBar = ({ 
  searchInput, 
  onSearchInputChange, 
  onSearch, 
  onClear, 
  isLoading = false,
  placeholder = "Søk..."
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 w-6 p-0 hover:bg-neutral-100"
            >
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

export default SearchBar;