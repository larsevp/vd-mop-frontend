import React from "react";
import SearchBar from "../../shared/SearchBar.jsx";

/**
 * TiltakSearchBar component for searching tiltak
 * Wraps the generic SearchBar with tiltak-specific configuration
 */
const TiltakSearchBar = ({ 
  searchInput, 
  onSearchInputChange, 
  onSearch, 
  onClear, 
  isLoading = false 
}) => {
  return (
    <SearchBar
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      onSearch={onSearch}
      onClear={onClear}
      isLoading={isLoading}
      placeholder="Søk i tiltak..."
    />
  );
};

export default TiltakSearchBar;