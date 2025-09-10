/**
 * KravTiltakSearchBar - Domain-specific search component for KravTiltak entities
 *
 * This component encapsulates all KravTiltak-specific search logic, filtering,
 * and API awareness. Each model adapter can customize this further if needed.
 */

import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Loader2, ArrowUpDown, ChevronDown, AlertTriangle, AlertCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";

const KravTiltakSearchBar = ({
  // Basic search props
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  isLoading = false,
  placeholder = "Søk...",

  // Advanced mode props
  mode = "advanced", // "simple" or "advanced"
  filterBy,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  entityType,
  additionalFilters = {},
  onAdditionalFiltersChange,

  // Model-specific configuration
  filterConfig = null,
  availableFilters = {},

  // Model-specific customization
  customFilterFields = null, // Allow models to add custom filter fields
  onCustomAction = null, // Allow models to add custom actions
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

  // Helper function to get priority icon component
  const getPriorityIcon = (level) => {
    switch (level) {
      case "høy":
        return <AlertTriangle size={14} className="text-red-600" />;
      case "middels":
        return <AlertCircle size={14} className="text-orange-600" />;
      case "lav":
        return <Circle size={14} className="text-green-600" />;
      default:
        return null;
    }
  };

  // Check if sorting should be disabled for project-specific entities
  const shouldDisableSorting = () => {
    const projectEntityTypes = ["prosjektKrav", "prosjektTiltak", "combined-prosjektkrav-prosjekttiltak"];
    return projectEntityTypes.includes(entityType);
  };

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
          setShowFilters(false);
        } else if (searchInput) {
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
  }

  // Advanced mode - KravTiltak-specific filtering
  const hasActiveFilters =
    filterBy !== "all" ||
    sortBy !== "updatedAt" ||
    additionalFilters.status ||
    additionalFilters.vurdering ||
    additionalFilters.emne ||
    additionalFilters.prioritet ||
    additionalFilters.entityType;

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
              showFilters || hasActiveFilters ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"
            }`}
            title="Vis filter"
          >
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Advanced filters dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-[9999]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic filter (KravTiltak-specific) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Filter</label>
              <Select value={filterBy} onValueChange={onFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="obligatorisk">Obligatoriske</SelectItem>
                  <SelectItem value="optional">Valgfrie</SelectItem>
                  {filterConfig?.customFilterOptions?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort - model-configured (hidden for project-specific entities) */}
            {!shouldDisableSorting() && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Sortering</label>
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split("-");
                    onSortChange(field);
                    onSortOrderChange(order);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {filterConfig?.sortFields ? (
                      filterConfig.sortFields
                        .map((field) => [
                          <SelectItem key={`${field.key}-desc`} value={`${field.key}-desc`}>
                            {field.label} (nyest/høyest)
                          </SelectItem>,
                          <SelectItem key={`${field.key}-asc`} value={`${field.key}-asc`}>
                            {field.label} (eldst/lavest)
                          </SelectItem>,
                        ])
                        .flat()
                    ) : (
                      // KravTiltak default sort options
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
            )}

            {/* Status filter (KravTiltak-specific) */}
            {filterConfig?.fields?.status?.enabled !== false && availableFilters.statuses?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">{filterConfig?.fields?.status?.label || "Status"}</label>
                <Select
                  value={additionalFilters.status || "all"}
                  onValueChange={(status) =>
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      status: status === "all" ? undefined : status,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">{filterConfig?.fields?.status?.placeholder || "Alle statuser"}</SelectItem>
                    {availableFilters.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Vurdering filter (KravTiltak-specific) */}
            {filterConfig?.fields?.vurdering?.enabled !== false && availableFilters.vurderinger?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">{filterConfig?.fields?.vurdering?.label || "Vurdering"}</label>
                <Select
                  value={additionalFilters.vurdering || "all"}
                  onValueChange={(vurdering) =>
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      vurdering: vurdering === "all" ? undefined : vurdering,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">{filterConfig?.fields?.vurdering?.placeholder || "Alle vurderinger"}</SelectItem>
                    {availableFilters.vurderinger.map((vurdering) => (
                      <SelectItem key={vurdering} value={vurdering}>
                        {vurdering}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Entity type filter (for combined views) */}
            {filterConfig?.fields?.entityType?.enabled && availableFilters.entityTypes?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">{filterConfig.fields.entityType.label}</label>
                <Select
                  value={additionalFilters.entityType || "all"}
                  onValueChange={(entityType) =>
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      entityType: entityType === "all" ? undefined : entityType,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">{filterConfig.fields.entityType.placeholder}</SelectItem>
                    {availableFilters.entityTypes.map((entityType) => (
                      <SelectItem key={entityType} value={entityType}>
                        {entityType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Emne filter (KravTiltak-specific) */}
            {filterConfig?.fields?.emne?.enabled && availableFilters.emner?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">{filterConfig.fields.emne.label}</label>
                <Select
                  value={additionalFilters.emne || "all"}
                  onValueChange={(emne) =>
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      emne: emne === "all" ? undefined : emne,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">{filterConfig.fields.emne.placeholder}</SelectItem>
                    {availableFilters.emner.map((emne) => (
                      <SelectItem key={emne} value={emne}>
                        {emne}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Prioritet filter (calculated levels) */}
            {filterConfig?.fields?.prioritet?.enabled && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Prioritet</label>
                <Select
                  value={additionalFilters.prioritet || "all"}
                  onValueChange={(prioritet) =>
                    onAdditionalFiltersChange({
                      ...additionalFilters,
                      prioritet: prioritet === "all" ? undefined : prioritet,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">Alle prioriteter</SelectItem>
                    <SelectItem value="høy">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon("høy")}
                        <span>Høy prioritet (≥30)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="middels">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon("middels")}
                        <span>Middels prioritet (20-29)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="lav">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon("lav")}
                        <span>Lav prioritet (&lt;20)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom filter fields - allow models to extend */}
            {customFilterFields &&
              customFilterFields.map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">{field.label}</label>
                  {field.render({
                    value: additionalFilters[field.key],
                    onChange: (value) =>
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        [field.key]: value,
                      }),
                  })}
                </div>
              ))}
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
                    // Use adapter defaults if available, otherwise KravTiltak defaults
                    const defaults = filterConfig?.defaults || {
                      filterBy: "all",
                      sortBy: "updatedAt",
                      sortOrder: "desc",
                    };
                    onFilterChange(defaults.filterBy);
                    onSortChange(defaults.sortBy);
                    onSortOrderChange(defaults.sortOrder);
                    onAdditionalFiltersChange({});
                    onSearch(); // Apply the reset immediately
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Nullstill alle filtre
                </button>
              )}
              {onCustomAction && (
                <button onClick={onCustomAction} className="text-xs text-blue-600 hover:text-blue-700">
                  Avansert søk
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(false)} className="text-xs text-gray-400 hover:text-gray-600">
              Lukk
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KravTiltakSearchBar;
