// Simple test to verify Jest setup works
import { EntityFilterService } from '../EntityFilterService';

describe('EntityFilterService - Simple Test', () => {
  test('should be defined', () => {
    expect(EntityFilterService).toBeDefined();
  });

  test('should have extractAvailableFilters method', () => {
    expect(typeof EntityFilterService.extractAvailableFilters).toBe('function');
  });

  test('should extract empty filters from empty array', () => {
    const result = EntityFilterService.extractAvailableFilters([]);
    
    expect(result).toEqual({
      statuses: [],
      vurderinger: [],
      emner: [],
      priorities: []
    });
  });
});