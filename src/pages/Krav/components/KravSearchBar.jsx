import React, { useRef, useCallback } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Search, X } from "lucide-react";

/**
 * Dedicated search component with proper separation of concerns
 */
const KravSearchBar = ({ searchInput, onSearchInputChange, onSearch, onClear, isLoading = false }) => {
  const searchInputRef = useRef(null);
  const clearButtonRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        onSearch();
      } else if (e.key === "Escape") {
        onClear();
      }
    },
    [onSearch, onClear]
  );

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      onSearchInputChange(value);

      // Show/hide clear button
      if (clearButtonRef.current) {
        clearButtonRef.current.style.display = value.length > 0 ? "block" : "none";
      }
    },
    [onSearchInputChange]
  );

  const handleClear = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    if (clearButtonRef.current) {
      clearButtonRef.current.style.display = "none";
    }
    onClear();
  }, [onClear]);

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
      <Input
        ref={searchInputRef}
        placeholder="Søk i krav..."
        value={searchInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-20"
        disabled={isLoading}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-7 px-2 text-neutral-500 hover:text-neutral-700"
          ref={clearButtonRef}
          style={{ display: "none" }}
          disabled={isLoading}
          title="Tøm søk"
        >
          <X size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSearch}
          className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          disabled={isLoading}
          title="Søk"
        >
          <Search size={14} />
        </Button>
      </div>
    </div>
  );
};

export default KravSearchBar;
