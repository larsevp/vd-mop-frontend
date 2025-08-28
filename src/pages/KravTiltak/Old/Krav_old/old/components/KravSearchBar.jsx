import React from "react";
import SearchBar from "../../shared/SearchBar.js";

/**
 * KravSearchBar component for searching krav
 * Wraps the generic SearchBar with krav-specific configuration
 */
const KravSearchBar = ({ searchInput, onSearchInputChange, onSearch, onClear, isLoading = false }) => {
  return (
    <SearchBar
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      onSearch={onSearch}
      onClear={onClear}
      isLoading={isLoading}
      placeholder="Søk i krav..."
    />
  );
};

export default KravSearchBar;
