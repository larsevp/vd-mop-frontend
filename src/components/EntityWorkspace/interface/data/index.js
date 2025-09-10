/**
 * DTO Factory and exports for EntityWorkspace interface
 * 
 * The interface is responsible for creating the appropriate DTO
 * based on the adapters provided by the domain logic.
 */

import { SingleEntityDTO, createSingleEntityDTO } from './SingleEntityDTO.js';
import { CombinedEntityDTO, createCombinedEntityDTO } from './CombinedEntityDTO.js';

/**
 * Factory function to create appropriate DTO based on adapter
 * 
 * @param {Object} adapter - Single adapter instance
 * @param {Object} options - Additional options for DTO creation
 * @returns {SingleEntityDTO|CombinedEntityDTO} Appropriate DTO instance
 */
export const createDTO = (adapter, options = {}) => {
  if (!adapter) {
    throw new Error('createDTO requires an adapter');
  }

  // Check if adapter supports combined views
  const displayConfig = adapter.getDisplayConfig();
  if (displayConfig.isCombinedView) {
    return createCombinedEntityDTO(adapter, options);
  }

  // Default to single entity DTO
  return createSingleEntityDTO(adapter, options);
};

/**
 * Hook to create DTO with proper memoization
 * 
 * @param {Object} adapter - Single adapter instance
 * @param {Object} options - Additional options for DTO creation
 * @returns {SingleEntityDTO|CombinedEntityDTO} Memoized DTO instance
 */
export const useDTO = (adapter, options = {}) => {
  const React = require('react');
  
  return React.useMemo(() => {
    return createDTO(adapter, options);
  }, [adapter, options]);
};

// Export DTO classes
export { SingleEntityDTO, CombinedEntityDTO };

// Export factory functions
export { createSingleEntityDTO, createCombinedEntityDTO };

export default createDTO;