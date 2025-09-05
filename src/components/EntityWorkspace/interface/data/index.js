/**
 * DTO Factory and exports for EntityWorkspace interface
 * 
 * The interface is responsible for creating the appropriate DTO
 * based on the adapters provided by the domain logic.
 */

import { SingleEntityDTO, createSingleEntityDTO } from './SingleEntityDTO.js';
import { CombinedEntityDTO, createCombinedEntityDTO } from './CombinedEntityDTO.js';

/**
 * Factory function to create appropriate DTO based on adapters
 * 
 * @param {Object|Array} adapters - Single adapter or array of adapters
 * @param {Object} options - Additional options for DTO creation
 * @returns {SingleEntityDTO|CombinedEntityDTO} Appropriate DTO instance
 */
export const createDTO = (adapters, options = {}) => {
  if (!adapters) {
    throw new Error('createDTO requires adapter(s)');
  }

  // Single adapter case
  if (!Array.isArray(adapters)) {
    return createSingleEntityDTO(adapters, options);
  }

  // Multiple adapters case
  if (adapters.length === 1) {
    return createSingleEntityDTO(adapters[0], options);
  }

  // Combined case
  return createCombinedEntityDTO(adapters, options);
};

/**
 * Hook to create DTO with proper memoization
 * 
 * @param {Object|Array} adapters - Single adapter or array of adapters  
 * @param {Object} options - Additional options for DTO creation
 * @returns {SingleEntityDTO|CombinedEntityDTO} Memoized DTO instance
 */
export const useDTO = (adapters, options = {}) => {
  const React = require('react');
  
  return React.useMemo(() => {
    return createDTO(adapters, options);
  }, [adapters, options]);
};

// Export DTO classes
export { SingleEntityDTO, CombinedEntityDTO };

// Export factory functions
export { createSingleEntityDTO, createCombinedEntityDTO };

export default createDTO;