import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Loader2, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { createEntityInterface } from "../utils/EntityInterface.js";

/**
 * Generic Search Bar Interface Component
 * 
 * Universal search component that works with any entity type using the adapter pattern.
 * Supports both simple and advanced search modes with unified configuration.
 */
const GenericSearchBar = ({
  // Unified configuration using adapter pattern
  config,        // { entityType, adapter, modelConfig }
  
  // Search state
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  
  // Filter state  
  filterBy,
  onFilterChange,
  additionalFilters = {},
  onAdditionalFiltersChange,
  
  // Sort state
  sortBy,
  sortOrder,
  onSortChange, 
  onSortOrderChange,
  
  // Available options (populated by adapter)
  availableStatuses = [],
  availableVurderinger = [],
  availableEmner = [],
  
  // UI options
  mode = "simple", // "simple" or "advanced"
  isLoading = false,
  placeholder,
  
  // Context
  context = {}
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);
  
  // Create EntityInterface for adapter-based operations
  const { entityType, modelConfig } = config;
  const entityInterface = createEntityInterface(entityType, { modelConfig });
  
  // Extract configuration using adapter
  const entityDisplayName = entityInterface.getEntityTypeDisplayName(true);
  const searchPlaceholder = placeholder || `Søk ${entityDisplayName.toLowerCase()}...`;

  // Get available sort options from adapter
  const sortOptions = entityInterface.adapter.getSortOptions(entityType);

  // Get available filter options from adapter  
  const filterOptions = entityInterface.adapter.getFilterOptions(entityType);

  // Global keyboard shortcuts for advanced mode
  useEffect(() => {
    if (mode === "advanced") {
      const handleGlobalKeyDown = (e) => {
        // Focus search with '/' key
        if (e.key === "/" && e.target !== searchRef.current) {
          e.preventDefault();
          searchRef.current?.focus();
        }
        // Close filters with Escape
        if (e.key === "Escape" && showFilters) {
          setShowFilters(false);
        }
      };

      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [mode, showFilters]);

  const handleClearSearch = () => {
    onClearSearch?.();
    searchRef.current?.focus();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch?.();
  };

  const renderSimpleSearch = () => (
    <form onSubmit={handleSearchSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={searchRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange?.(e.target.value)}
          className="pl-10 pr-8"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500 mt-2" />}
    </form>
  );

  const renderAdvancedSearch = () => (
    <div className="space-y-4">
      {/* Main search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchRef}
            type="text"
            placeholder={`${searchPlaceholder} (trykk '/' for å fokusere)`}
            value={searchInput}
            onChange={(e) => onSearchInputChange?.(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
        
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500 mt-2" />}
      </form>

      {/* Quick filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filterBy === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange?.(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortOrderChange?.(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status filter */}
            {availableStatuses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  value={additionalFilters.status || ""}
                  onValueChange={(value) => 
                    onAdditionalFiltersChange?.({
                      ...additionalFilters,
                      status: value || undefined
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle statuser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle statuser</SelectItem>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status.id || status.navn} value={status.navn}>
                        {status.navn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Vurdering filter */}
            {availableVurderinger.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vurdering
                </label>
                <Select
                  value={additionalFilters.vurdering || ""}
                  onValueChange={(value) =>
                    onAdditionalFiltersChange?.({
                      ...additionalFilters,
                      vurdering: value || undefined
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle vurderinger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle vurderinger</SelectItem>
                    {availableVurderinger.map((vurdering) => (
                      <SelectItem key={vurdering.id || vurdering.navn} value={vurdering.navn}>
                        {vurdering.navn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Emne filter */}
            {availableEmner.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emne
                </label>
                <Select
                  value={additionalFilters.emne || ""}
                  onValueChange={(value) =>
                    onAdditionalFiltersChange?.({
                      ...additionalFilters,
                      emne: value || undefined
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle emner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle emner</SelectItem>
                    {availableEmner.map((emne) => (
                      <SelectItem key={emne.id || emne.tittel} value={emne.tittel}>
                        {emne.tittel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Clear filters */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdditionalFiltersChange?.({})}
            >
              Nullstill filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="generic-search-bar">
      {mode === "simple" ? renderSimpleSearch() : renderAdvancedSearch()}
    </div>
  );
};

export default GenericSearchBar;