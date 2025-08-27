import React from "react";
import EntityFilters from "../../shared/EntityFilters.jsx";

/**
 * TiltakFilters component for filtering and sorting tiltak
 * Wraps the generic EntityFilters with tiltak-specific configuration
 */
const TiltakFilters = ({ 
  filterBy, 
  onFilterChange, 
  viewMode, 
  onViewModeChange, 
  sortBy, 
  onSortChange, 
  sortOrder, 
  onSortOrderChange 
}) => {
  const tiltakFilterOptions = [
    { value: "all", label: "Alle tiltak" },
    { value: "obligatorisk", label: "Obligatoriske" },
    { value: "optional", label: "Valgfrie" },
    { value: "active", label: "Aktive" },
    { value: "completed", label: "Fullførte" }
  ];

  const tiltakSortOptions = [
    { value: "updatedAt", label: "Sist oppdatert" },
    { value: "createdAt", label: "Opprettet" },
    { value: "tittel", label: "Tittel" },
    { value: "prioritet", label: "Prioritet" },
    { value: "obligatorisk", label: "Obligatorisk" }
  ];

  return (
    <EntityFilters
      filterBy={filterBy}
      onFilterChange={onFilterChange}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      sortBy={sortBy}
      onSortChange={onSortChange}
      sortOrder={sortOrder}
      onSortOrderChange={onSortOrderChange}
      filterOptions={tiltakFilterOptions}
      sortOptions={tiltakSortOptions}
      entityType="tiltak"
    />
  );
};

export default TiltakFilters;