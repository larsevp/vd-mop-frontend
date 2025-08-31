import { EntityFilterService } from '../EntityFilterService';

describe('EntityFilterService', () => {
  // Mock data for testing
  const mockItems = [
    {
      id: 1,
      tittel: 'Test Krav 1',
      obligatorisk: true,
      prioritet: 1,
      status: { navn: 'Aktiv', id: 1 },
      vurdering: { navn: 'Høy', id: 1 },
      emne: { tittel: 'Støy', id: 1 }
    },
    {
      id: 2,
      tittel: 'Test Krav 2',
      obligatorisk: false,
      prioritet: 3,
      status: { navn: 'Inaktiv', id: 2 },
      vurdering: { navn: 'Lav', id: 2 },
      emne: { tittel: 'Luft', id: 2 }
    },
    {
      id: 3,
      tittel: 'Test Krav 3',
      obligatorisk: true,
      prioritet: 5,
      status: 'Aktiv', // String format
      vurdering: 'Medium', // String format
      emne: null // No emne
    }
  ];

  const mockGroupedItems = [
    {
      emne: { tittel: 'Støy', id: 1 },
      krav: [mockItems[0]]
    },
    {
      emne: { tittel: 'Luft', id: 2 },
      krav: [mockItems[1]]
    },
    {
      emne: { tittel: 'Ingen emne', id: null },
      krav: [mockItems[2]]
    }
  ];

  describe('extractAvailableFilters', () => {
    it('should extract filters from flat items array', () => {
      const result = EntityFilterService.extractAvailableFilters(mockItems);
      
      expect(result).toEqual({
        statuses: ['Aktiv', 'Inaktiv'],
        vurderinger: ['Høy', 'Lav', 'Medium'],
        emner: ['Luft', 'Støy'], // Sorted alphabetically, null filtered out
        priorities: ['høy', 'lav', 'medium']
      });
    });

    it('should extract filters from grouped items array', () => {
      const result = EntityFilterService.extractAvailableFilters(mockGroupedItems, 'krav');
      
      expect(result).toEqual({
        statuses: ['Aktiv', 'Inaktiv'],
        vurderinger: ['Høy', 'Lav', 'Medium'],
        emner: ['Ingen emne', 'Luft', 'Støy'],
        priorities: ['høy', 'lav', 'medium']
      });
    });

    it('should handle empty array', () => {
      const result = EntityFilterService.extractAvailableFilters([]);
      
      expect(result).toEqual({
        statuses: [],
        vurderinger: [],
        emner: [],
        priorities: []
      });
    });

    it('should handle null/undefined input', () => {
      expect(EntityFilterService.extractAvailableFilters(null)).toEqual({
        statuses: [],
        vurderinger: [],
        emner: [],
        priorities: []
      });
    });
  });

  describe('applyFilters', () => {
    it('should filter by status', () => {
      const filters = { status: 'Aktiv' };
      const result = EntityFilterService.applyFilters(mockItems, filters);
      
      expect(result).toHaveLength(2); // Items 1 and 3 have Aktiv status
      expect(result.every(item => 
        (typeof item.status === 'string' && item.status === 'Aktiv') ||
        (typeof item.status === 'object' && item.status?.navn === 'Aktiv')
      )).toBe(true);
    });

    it('should filter by obligatory status', () => {
      const filters = { filterBy: 'obligatorisk' };
      const result = EntityFilterService.applyFilters(mockItems, filters);
      
      expect(result).toHaveLength(2); // Items 1 and 3 are obligatory
      expect(result.every(item => item.obligatorisk === true)).toBe(true);
    });

    it('should filter by priority category', () => {
      const filters = { priority: 'høy' };
      const result = EntityFilterService.applyFilters(mockItems, filters);
      
      expect(result).toHaveLength(1); // Only item 1 has høy priority (prioritet: 1)
      expect(result[0].prioritet).toBe(1);
    });

    it('should apply multiple filters', () => {
      const filters = { 
        status: 'Aktiv',
        filterBy: 'obligatorisk',
        priority: 'høy'
      };
      const result = EntityFilterService.applyFilters(mockItems, filters);
      
      expect(result).toHaveLength(1); // Only item 1 matches all criteria
      expect(result[0].id).toBe(1);
    });

    it('should handle grouped data filtering', () => {
      const filters = { status: 'Aktiv' };
      const result = EntityFilterService.applyFilters(mockGroupedItems, filters, 'krav', true);
      
      expect(result).toHaveLength(3); // All groups remain
      expect(result[0].krav).toHaveLength(1); // First group has 1 item
      expect(result[1].krav).toHaveLength(0); // Second group has 0 items (filtered out)
      expect(result[2].krav).toHaveLength(1); // Third group has 1 item
    });

    it('should return original items when no filters applied', () => {
      const result = EntityFilterService.applyFilters(mockItems, {});
      expect(result).toEqual(mockItems);
    });
  });

  describe('calculateStats', () => {
    it('should calculate stats for flat items', () => {
      const result = EntityFilterService.calculateStats(mockItems);
      
      expect(result).toEqual({
        total: 3,
        obligatorisk: 2,
        optional: 1
      });
    });

    it('should calculate stats for grouped items', () => {
      const result = EntityFilterService.calculateStats(mockGroupedItems, 'krav', true);
      
      expect(result).toEqual({
        total: 3,
        obligatorisk: 2,
        optional: 1
      });
    });

    it('should handle empty items', () => {
      const result = EntityFilterService.calculateStats([]);
      
      expect(result).toEqual({
        total: 0,
        obligatorisk: 0,
        optional: 0
      });
    });
  });

  describe('private helper methods', () => {
    describe('_categorizePriority', () => {
      it('should categorize priorities correctly', () => {
        expect(EntityFilterService._categorizePriority(1)).toBe('høy');
        expect(EntityFilterService._categorizePriority(2)).toBe('høy');
        expect(EntityFilterService._categorizePriority(3)).toBe('medium');
        expect(EntityFilterService._categorizePriority(4)).toBe('lav');
        expect(EntityFilterService._categorizePriority(5)).toBe('lav');
      });
    });

    describe('_matchesFilter', () => {
      it('should match string values', () => {
        expect(EntityFilterService._matchesFilter('Aktiv', 'Aktiv')).toBe(true);
        expect(EntityFilterService._matchesFilter('Aktiv', 'Inaktiv')).toBe(false);
      });

      it('should match object values', () => {
        const statusObj = { navn: 'Aktiv', id: 1 };
        expect(EntityFilterService._matchesFilter(statusObj, 'Aktiv')).toBe(true);
        expect(EntityFilterService._matchesFilter(statusObj, 'Inaktiv')).toBe(false);
      });

      it('should handle "all" filter value', () => {
        expect(EntityFilterService._matchesFilter('Aktiv', 'all')).toBe(true);
        expect(EntityFilterService._matchesFilter('Inaktiv', 'all')).toBe(true);
      });
    });
  });
});