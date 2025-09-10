/**
 * Advanced SearchBar component for EntityWorkspace (copied from main branch)
 * Supports both simple search (card layout) and advanced search with filters (split layout)
 */

import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Loader2, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";

const SearchBar = ({
  // Basic search props
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  isLoading = false,
  placeholder = "Søk...",
  
  // Advanced mode props (for split layout)
  mode = "advanced", // "simple" or "advanced" - default to advanced for new system
  filterBy,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  entityType,
  additionalFilters = {},
  onAdditionalFiltersChange,
  availableStatuses = [],
  availableVurderinger = [],
  
  // NEW: Adapter configuration (when provided, overrides hardcoded options)
  filterConfig = null,
  availableFilters = {},
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

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

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        onSearch();
        break;
      case "Escape":
        if (showFilters && mode === "advanced") {
          // Close filters panel
          setShowFilters(false);
        } else if (searchInput) {
          // Clear search only (don't reset filters)
          onClearSearch();
        } else {
          searchRef.current?.blur();
        }
        break;
    }
  };

  // Simple mode (card layout)
  if (mode === "simple") {
    return (
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
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
  }

  // Advanced mode (split layout) - full HeaderSearchBar functionality
  const hasActiveFilters = filterBy !== "all" || 
    sortBy !== "updatedAt" || 
    additionalFilters.status ||
    additionalFilters.vurdering ||
    additionalFilters.emne ||
    additionalFilters.prioritet;

  return (
    <div className="relative flex-1 max-w-lg">
      {/* Search input with integrated filter button */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-20 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />

        {/* Right side actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}

          {searchInput && (
            <button onClick={onClearSearch} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Fjern søk">
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded transition-colors ${
              showFilters || hasActiveFilters
                ? "text-blue-600 bg-blue-50"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Vis filter"
          >
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Advanced filters dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Filter</label>
              <Select value={filterBy} onValueChange={onFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="obligatorisk">Obligatoriske</SelectItem>
                  <SelectItem value="optional">Valgfrie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort - use adapter config if available */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Sortering</label>
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  onSortChange(field);
                  onSortOrderChange(order);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterConfig?.sortFields ? (
                    filterConfig.sortFields.map(field => [
                      <SelectItem key={`${field.key}-desc`} value={`${field.key}-desc`}>
                        {field.label} (nyest/høyest)
                      </SelectItem>,
                      <SelectItem key={`${field.key}-asc`} value={`${field.key}-asc`}>
                        {field.label} (eldst/lavest)
                      </SelectItem>
                    ]).flat()
                  ) : (
                    <>
                      <SelectItem value="updatedAt-desc">Sist oppdatert (nyest)</SelectItem>
                      <SelectItem value="updatedAt-asc">Sist oppdatert (eldst)</SelectItem>
                      <SelectItem value="tittel-asc">Tittel A-Z</SelectItem>
                      <SelectItem value="tittel-desc">Tittel Z-A</SelectItem>
                      <SelectItem value="prioritet-asc">Prioritet (lav-høy)</SelectItem>
                      <SelectItem value="prioritet-desc">Prioritet (høy-lav)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status filter - use adapter config if available */}
            {(filterConfig?.fields?.status?.enabled !== false && (availableFilters.statuses?.length > 0 || availableStatuses.length > 0)) && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  {filterConfig?.fields?.status?.label || 'Status'}
                </label>
                <Select 
                  value={additionalFilters.status || "all"} 
                  onValueChange={(status) => 
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      status: status === "all" ? undefined : status
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filterConfig?.fields?.status?.placeholder || 'Alle statuser'}
                    </SelectItem>
                    {(availableFilters.statuses || availableStatuses).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Vurdering filter - use adapter config if available */}
            {(filterConfig?.fields?.vurdering?.enabled !== false && (availableFilters.vurderinger?.length > 0 || availableVurderinger.length > 0)) && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  {filterConfig?.fields?.vurdering?.label || 'Vurdering'}
                </label>
                <Select 
                  value={additionalFilters.vurdering || "all"} 
                  onValueChange={(vurdering) => 
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      vurdering: vurdering === "all" ? undefined : vurdering
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filterConfig?.fields?.vurdering?.placeholder || 'Alle vurderinger'}
                    </SelectItem>
                    {(availableFilters.vurderinger || availableVurderinger).map(vurdering => (
                      <SelectItem key={vurdering} value={vurdering}>{vurdering}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Entity type filter for combined views */}
            {filterConfig?.fields?.entityType?.enabled && availableFilters.entityTypes?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  {filterConfig.fields.entityType.label}
                </label>
                <Select 
                  value={additionalFilters.entityType || "all"} 
                  onValueChange={(entityType) => 
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      entityType: entityType === "all" ? undefined : entityType
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filterConfig.fields.entityType.placeholder}
                    </SelectItem>
                    {availableFilters.entityTypes.map(entityType => (
                      <SelectItem key={entityType} value={entityType}>
                        {entityType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Emne filter */}
            {filterConfig?.fields?.emne?.enabled && availableFilters.emner?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  {filterConfig.fields.emne.label}
                </label>
                <Select 
                  value={additionalFilters.emne || "all"} 
                  onValueChange={(emne) => 
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      emne: emne === "all" ? undefined : emne
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filterConfig.fields.emne.placeholder}
                    </SelectItem>
                    {availableFilters.emner.map(emne => (
                      <SelectItem key={emne} value={emne}>{emne}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onSearch();
                  setShowFilters(false);
                }}
                size="sm"
                className="text-xs"
              >
                Bruk filter
              </Button>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    // Use adapter defaults if available, otherwise fallback to hardcoded
                    const defaults = filterConfig?.defaults || {};
                    onFilterChange(defaults.filterBy || "all");
                    onSortChange(defaults.sortBy || "updatedAt");
                    onSortOrderChange(defaults.sortOrder || "desc");
                    onAdditionalFiltersChange({});
                    onSearch(); // Apply the reset immediately
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Nullstill alle filtre
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Lukk
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;