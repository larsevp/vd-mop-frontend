import React from "react";
import { Button } from "@/components/ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Grid3x3, List, Filter } from "lucide-react";

/**
 * Dedicated filters and view controls component
 */
const KravFilters = ({
  filterBy,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-neutral-500" />
        <Select value={filterBy} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrer krav" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle krav</SelectItem>
            <SelectItem value="obligatorisk">Obligatoriske</SelectItem>
            <SelectItem value="optional">Valgfrie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <Select 
          value={`${sortBy}-${sortOrder}`} 
          onValueChange={(value) => {
            const [field, order] = value.split('-');
            onSortChange(field);
            onSortOrderChange(order);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sorter etter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt-desc">Sist oppdatert (nyest)</SelectItem>
            <SelectItem value="updatedAt-asc">Sist oppdatert (eldst)</SelectItem>
            <SelectItem value="createdAt-desc">Opprettet (nyest)</SelectItem>
            <SelectItem value="createdAt-asc">Opprettet (eldst)</SelectItem>
            <SelectItem value="tittel-asc">Tittel (A-Z)</SelectItem>
            <SelectItem value="tittel-desc">Tittel (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Mode */}
      <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("grid")}
          className="rounded-none border-0"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("list")}
          className="rounded-none border-0"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default KravFilters;