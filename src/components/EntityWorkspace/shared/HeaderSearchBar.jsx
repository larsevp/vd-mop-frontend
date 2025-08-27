import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Loader2, ArrowUpDown, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";

/**
 * Comprehensive header search bar with integrated filtering
 * Designed for the EntityWorkspace split view header
 */
const HeaderSearchBar = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  isLoading,
  placeholder,
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
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

  // Global keyboard shortcuts
  useEffect(() => {
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
  }, [showFilters]);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        onSearch();
        break;
      case "Escape":
        if (searchInput) {
          onClearSearch();
        } else if (showFilters) {
          setShowFilters(false);
        } else {
          searchRef.current.blur();
        }
        break;
    }
  };

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
              showFilters ||
              filterBy !== "all" ||
              sortBy !== "updatedAt" ||
              additionalFilters.status ||
              additionalFilters.vurdering ||
              additionalFilters.priority
                ? "text-blue-600 bg-blue-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
            title="Filtrer og sorter"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dropdown filters panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Filter dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Filter</label>
              <Select value={filterBy} onValueChange={onFilterChange}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder={`Alle ${entityType}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle {entityType}</SelectItem>
                  <SelectItem value="obligatorisk">Obligatoriske</SelectItem>
                  <SelectItem value="optional">Valgfrie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort controls */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Sorter etter</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue placeholder="Velg sortering" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatedAt">Sist oppdatert</SelectItem>
                    <SelectItem value="createdAt">Opprettet</SelectItem>
                    <SelectItem value="tittel">Tittel</SelectItem>
                    <SelectItem value="prioritet">Prioritet</SelectItem>
                    <SelectItem value="obligatorisk">Obligatorisk</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title={`Sorter ${sortOrder === "asc" ? "synkende" : "stigende"}`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Additional filters row */}
          {(availableStatuses.length > 0 || availableVurderinger.length > 0) && (
            <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-100">
              {/* Status filter */}
              {availableStatuses.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                  <Select
                    value={additionalFilters.status || "all"}
                    onValueChange={(value) =>
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        status: value === "all" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Alle statuser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statuser</SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Vurdering filter */}
              {availableVurderinger.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Vurdering</label>
                  <Select
                    value={additionalFilters.vurdering || "all"}
                    onValueChange={(value) =>
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        vurdering: value === "all" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Alle vurderinger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle vurderinger</SelectItem>
                      {availableVurderinger.map((vurdering) => (
                        <SelectItem key={vurdering} value={vurdering}>
                          {vurdering}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Priority filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Prioritet</label>
                <Select
                  value={additionalFilters.priority || "all"}
                  onValueChange={(value) =>
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      priority: value === "all" ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Alle prioriteter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle prioriteter</SelectItem>
                    <SelectItem value="høy">Høy (1-2)</SelectItem>
                    <SelectItem value="medium">Medium (3)</SelectItem>
                    <SelectItem value="lav">Lav (4-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active filters indicator */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            {searchInput && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                Søk: "{searchInput}"
                <button onClick={onClearSearch} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterBy !== "all" && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                Filter: {filterBy}
                <button onClick={() => onFilterChange("all")} className="hover:text-gray-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {additionalFilters.status && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                Status: {additionalFilters.status}
                <button onClick={() => onAdditionalFiltersChange({ ...additionalFilters, status: null })} className="hover:text-green-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {additionalFilters.vurdering && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                Vurdering: {additionalFilters.vurdering}
                <button
                  onClick={() => onAdditionalFiltersChange({ ...additionalFilters, vurdering: null })}
                  className="hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {additionalFilters.priority && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
                Prioritet: {additionalFilters.priority}
                <button
                  onClick={() => onAdditionalFiltersChange({ ...additionalFilters, priority: null })}
                  className="hover:text-orange-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(searchInput ||
              filterBy !== "all" ||
              additionalFilters.status ||
              additionalFilters.vurdering ||
              additionalFilters.priority) && (
              <button
                onClick={() => {
                  onClearSearch();
                  onFilterChange("all");
                  onAdditionalFiltersChange({});
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Fjern alle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;
