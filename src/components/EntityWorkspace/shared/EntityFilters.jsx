import React from "react";
import { Button } from "@/components/ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Filter, Grid, List, ArrowUpDown } from "lucide-react";

/**
 * Generic EntityFilters component for filtering and sorting entities
 * Configurable filter options based on entity type
 */
const EntityFilters = ({
  filterBy,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  filterOptions = [],
  sortOptions = [],
  entityType = "element",
  // Additional filters for status, vurdering, prioritet
  additionalFilters = {},
  onAdditionalFiltersChange = () => {},
  availableStatuses = [],
  availableVurderinger = [],
}) => {
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleAdditionalFilterChange = (filterType, value) => {
    if (onAdditionalFiltersChange && typeof onAdditionalFiltersChange === "function") {
      onAdditionalFiltersChange({
        ...additionalFilters,
        [filterType]: value === "all" ? undefined : value,
      });
    }
  };

  // Default filter options if none provided
  const defaultFilterOptions = [
    { value: "all", label: `Alle ${entityType}` },
    { value: "obligatorisk", label: "Obligatoriske" },
    { value: "optional", label: "Valgfrie" },
  ];

  // Default sort options if none provided
  const defaultSortOptions = [
    { value: "updatedAt", label: "Sist oppdatert" },
    { value: "createdAt", label: "Opprettet" },
    { value: "tittel", label: "Tittel" },
    { value: "prioritet", label: "Prioritet" },
    { value: "obligatorisk", label: "Obligatorisk" },
  ];

  const finalFilterOptions = filterOptions.length > 0 ? filterOptions : defaultFilterOptions;
  const finalSortOptions = sortOptions.length > 0 ? sortOptions : defaultSortOptions;

  return (
    <div className="flex items-center gap-3">
      {/* Filter Dropdown */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-neutral-500" />
        <Select value={filterBy} onValueChange={onFilterChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter..." />
          </SelectTrigger>
          <SelectContent>
            {finalFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      {availableStatuses.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={additionalFilters.statusId ? additionalFilters.statusId.toString() : "all"}
            onValueChange={(value) => handleAdditionalFilterChange("statusId", value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle status</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Vurdering Filter */}
      {availableVurderinger.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={additionalFilters.vurderingId ? additionalFilters.vurderingId.toString() : "all"}
            onValueChange={(value) => handleAdditionalFilterChange("vurderingId", value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Vurdering..." />
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

      {/* Prioritet Filter */}
      <div className="flex items-center gap-2">
        <Select value={additionalFilters.prioritet || "all"} onValueChange={(value) => handleAdditionalFilterChange("prioritet", value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioritet..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle prioriteter</SelectItem>
            <SelectItem value="høy">Høy (1-2)</SelectItem>
            <SelectItem value="medium">Medium (3)</SelectItem>
            <SelectItem value="lav">Lav (4-5)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sorter etter..." />
          </SelectTrigger>
          <SelectContent>
            {finalSortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          className="px-3"
          title={`Sorter ${sortOrder === "asc" ? "synkende" : "stigende"}`}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center border rounded-md">
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("grid")}
          className="rounded-r-none"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("list")}
          className="rounded-l-none"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EntityFilters;
