/**
 * KravTiltakSearchBar - Domain-specific search component for KravTiltak entities
 *
 * This component encapsulates all KravTiltak-specific search logic, filtering,
 * and API awareness. Each model adapter can customize this further if needed.
 */

import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Loader2, ArrowUpDown, ChevronDown, Triangle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { StatusSelect } from "@/components/ui/form/StatusSelect";
import { VurderingSelect } from "@/components/ui/form/VurderingSelect";
import { EmneSelect } from "@/components/ui/form/EmneSelect";
import { getPriorityIcon as getCentralizedPriorityIcon } from "../config/priorityConfig";

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

  // View options - controls what's visible in the UI
  viewOptions = {},

  // Model-specific customization
  customFilterFields = null, // Allow models to add custom filter fields
  onCustomAction = null, // Allow models to add custom actions
}) => {
  
  const [showFilters, setShowFilters] = useState(false);
  const [pulseFilter, setPulseFilter] = useState(false);
  const searchRef = useRef(null);


  // Helper function to get priority icon component using centralized config
  const getPriorityIcon = (level) => {
    const config = getCentralizedPriorityIcon(level);
    if (!config) return null;

    const Icon = config.icon;
    return <Icon size={14} className={config.rotation} style={{ color: config.color }} />;
  };

  // Check if sorting should be disabled for project-specific entities
  const shouldDisableSorting = () => {
    const projectEntityTypes = ["prosjektKrav", "prosjektTiltak", "combined-prosjektkrav-prosjekttiltak"];
    return projectEntityTypes.includes(entityType);
  };

  // Check if any filters are currently active
  const hasActiveFilters = () => {
    return filterBy !== "all" ||
      additionalFilters.statusId ||
      additionalFilters.vurderingId ||
      additionalFilters.emneId ||
      additionalFilters.prioritet ||
      additionalFilters.obligatorisk ||
      additionalFilters.entityType ||
      additionalFilters.onlyProjectCreated;
  };

  // Trigger pulse animation when searching with active filters
  const triggerFilterPulse = () => {
    if (hasActiveFilters() && searchInput?.trim()) {
      setPulseFilter(true);
      setTimeout(() => setPulseFilter(false), 3000); // Pulse for 3 seconds
    }
  };

  // Global keyboard shortcuts for advanced mode
  useEffect(() => {
    if (mode === "advanced") {
      const handleGlobalKeyDown = (e) => {
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
        triggerFilterPulse(); // Pulse filter button if filters are active
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
              onClick={() => {
                triggerFilterPulse(); // Pulse filter button if filters are active
                onSearch();
              }}
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

  return (
    <div className="relative flex-1 max-w-lg xl:max-w-3xl">
      {/* Search input with integrated filter button */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Søk"
          className="w-full h-10 pl-10 pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />

        {/* Right side actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}

          {searchInput && (
            <button onClick={onClearSearch} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Fjern søk">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search button */}
          <button
            onClick={() => {
              triggerFilterPulse(); // Pulse filter button if filters are active
              onSearch();
            }}
            className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
            title="Søk"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded transition-colors ${
              showFilters || hasActiveFilters() ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"
            }`}
            title="Vis filter"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced filters dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-[9999] min-w-[600px] max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Filtrer resultater</h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filter Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Emne filter - Always first position for consistency */}
              {filterConfig?.fields?.emne?.enabled !== false && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{filterConfig?.fields?.emne?.label || "Emne"}</label>
                  <EmneSelect
                    name="emneId"
                    value={additionalFilters.emneId || null}
                    onChange={(event) => {
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        emneId: event.target.value,
                      });
                    }}
                    allowEmpty={true}
                    emptyLabel="Alle emner"
                    availableIds={availableFilters?.emneIds}
                  />
                </div>
              )}

              {/* Project-created only filter - only show for ProsjektKrav/ProsjektTiltak */}
              {(entityType === "prosjektKrav" || entityType === "prosjektTiltak" ||
                entityType === "combined-prosjektkrav-prosjekttiltak") && (
                <div className="col-span-full">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={additionalFilters.onlyProjectCreated || false}
                      onChange={(e) => {
                        onAdditionalFiltersChange({
                          ...additionalFilters,
                          onlyProjectCreated: e.target.checked,
                        });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Vis kun prosjektspesifikke</span>
                    <span className="text-xs text-gray-500">(skjul kopiert fra bibliotek)</span>
                  </label>
                </div>
              )}

              {/* Status filter */}
              {filterConfig?.fields?.status?.enabled !== false && 
               viewOptions?.showStatus !== false && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{filterConfig?.fields?.status?.label || "Status"}</label>
                  <StatusSelect
                    name="statusId"
                    value={additionalFilters.statusId || null}
                    onChange={(event) => {
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        statusId: event.target.value,
                      });
                    }}
                    allowEmpty={true}
                    emptyLabel="Alle statuser"
                    availableIds={availableFilters?.statusIds}
                  />
                </div>
              )}

              {/* Vurdering filter */}
              {filterConfig?.fields?.vurdering?.enabled !== false && 
               viewOptions?.showVurdering !== false && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{filterConfig?.fields?.vurdering?.label || "Vurdering"}</label>
                  <VurderingSelect
                    name="vurderingId"
                    value={additionalFilters.vurderingId || null}
                    onChange={(event) => {
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        vurderingId: event.target.value,
                      });
                    }}
                    allowEmpty={true}
                    emptyLabel="Alle vurderinger"
                    availableIds={availableFilters?.vurderingIds}
                  />
                </div>
              )}

              {/* Prioritet filter (calculated levels) */}
              {filterConfig?.fields?.prioritet?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioritet</label>
                  <Select
                    value={additionalFilters.prioritet || "all"}
                    onValueChange={(prioritet) =>
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        prioritet: prioritet === "all" ? undefined : prioritet,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prioritet..." />
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

              {/* Obligatorisk filter */}
              {filterConfig?.fields?.obligatorisk?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{filterConfig.fields.obligatorisk.label}</label>
                  <Select
                    value={additionalFilters.obligatorisk || "all"}
                    onValueChange={(obligatorisk) =>
                      onAdditionalFiltersChange({
                        ...additionalFilters,
                        obligatorisk: obligatorisk === "all" ? undefined : obligatorisk,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg obligatorisk..." />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">Alle typer</SelectItem>
                      <SelectItem value="true">Obligatorisk</SelectItem>
                      <SelectItem value="false">Valgfri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom filter fields - allow models to extend */}
              {customFilterFields &&
                customFilterFields.map((field, index) => (
                  <div key={index} className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">{field.label}</label>
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
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  onSearch();
                  setShowFilters(false);
                }}
                size="sm"
                className="h-8 px-3 text-xs font-medium"
              >
                Bruk filter
              </Button>
              <button
                onClick={() => {
                  // Reset all filters and search input
                  const defaults = filterConfig?.defaults || {
                    filterBy: "all",
                  };
                  onFilterChange(defaults.filterBy);
                  onAdditionalFiltersChange({});
                  onSearchInputChange(""); // Clear search input
                  onSearch(); // Apply the reset immediately
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
              >
                Nullstill alle filtre
              </button>
              {onCustomAction && (
                <button 
                  onClick={onCustomAction} 
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  Avansert søk
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(false)} 
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
            >
              Lukk
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KravTiltakSearchBar;
