/**
 * EntityWorkspaceCore Zustand Integration Test
 * Verifies that the Zustand store properly handles all data flows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useEntityWorkspaceStore from '../implementations/kravTiltak/stores/entityWorkspaceStore';

// Mock the dependencies
vi.mock('../implementations/kravTiltak/services/EntityTypeResolver', () => ({
  EntityTypeResolver: {
    resolveApiConfig: vi.fn(() => ({
      createFn: vi.fn(),
      updateFn: vi.fn(),
      deleteFn: vi.fn()
    })),
    getDisplayName: vi.fn(() => 'Test Entity')
  }
}));

vi.mock('../implementations/kravTiltak/services/EntityFilterService', () => ({
  EntityFilterService: {
    applyFilters: vi.fn((items, filters) => items),
    calculateStats: vi.fn(() => ({ total: 1, obligatorisk: 1, optional: 0 })),
    extractAvailableFilters: vi.fn(() => ({
      statuses: ['Aktiv'],
      vurderinger: ['Høy'],
      emner: ['Støy'],
      priorities: []
    }))
  }
}));

vi.mock('../shared/utils/optimisticUpdates', () => ({
  handleOptimisticEntityUpdate: vi.fn()
}));

describe('EntityWorkspaceCore Zustand Integration', () => {
  let store;

  beforeEach(() => {
    // Reset the store before each test
    store = useEntityWorkspaceStore.getState();
    store.reset();
  });

  describe('Store Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      expect(result.current.currentEntityType).toBeNull();
      expect(result.current.searchInput).toBe('');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filterBy).toBe('all');
      expect(result.current.sortBy).toBe('updatedAt');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.viewMode).toBe('split');
      expect(result.current.groupByEmne).toBe(true);
    });

    it('should initialize workspace correctly', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      const mockModelConfig = { title: 'Krav', workspace: {} };
      const mockWorkspaceConfig = { layout: 'card' };
      
      act(() => {
        result.current.initializeWorkspace('krav', mockModelConfig, mockWorkspaceConfig);
      });
      
      expect(result.current.currentEntityType).toBe('krav');
      expect(result.current.modelConfig).toBe(mockModelConfig);
      expect(result.current.workspaceConfig).toBe(mockWorkspaceConfig);
      expect(result.current.viewMode).toBe('card');
      expect(result.current.groupByEmne).toBe(true); // krav defaults to true
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input changes', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.handleSearchInputChange('test search');
      });
      
      expect(result.current.searchInput).toBe('test search');
    });

    it('should execute search and update query', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.handleSearchInputChange('test query');
        result.current.handleSearch();
      });
      
      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.page).toBe(1); // Should reset page
    });

    it('should clear search properly', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.handleSearchInputChange('test');
        result.current.handleSearch();
        result.current.handleClearSearch();
      });
      
      expect(result.current.searchInput).toBe('');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.page).toBe(1);
    });
  });

  describe('Filtering Functionality', () => {
    it('should handle filter changes', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.handleFilterChange('obligatorisk');
      });
      
      expect(result.current.filterBy).toBe('obligatorisk');
      expect(result.current.page).toBe(1);
    });

    it('should handle additional filter changes', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      const additionalFilters = { status: 'Aktiv', emne: 'Støy' };
      
      act(() => {
        result.current.handleAdditionalFiltersChange(additionalFilters);
      });
      
      expect(result.current.additionalFilters).toEqual(additionalFilters);
      expect(result.current.page).toBe(1);
    });

    it('should get filtering info with empty items', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.initializeWorkspace('krav', { title: 'Krav' });
      });
      
      const filteringInfo = result.current.getFilteringInfo([]);
      
      expect(filteringInfo.filteredItems).toEqual([]);
      expect(filteringInfo.filteredStats).toEqual({
        total: 0,
        obligatorisk: 0,
        optional: 0
      });
      expect(filteringInfo.hasActiveFilters).toBe(false);
    });

    it('should get filtering info with real items', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      const mockItems = [
        { id: 1, tittel: 'Test Krav', obligatorisk: true, status: 'Aktiv' }
      ];
      
      act(() => {
        result.current.initializeWorkspace('krav', { title: 'Krav' });
      });
      
      const filteringInfo = result.current.getFilteringInfo(mockItems);
      
      expect(filteringInfo.filteredItems).toEqual(mockItems);
      expect(filteringInfo.availableStatuses).toEqual(['Aktiv']);
      expect(filteringInfo.availableVurderinger).toEqual(['Høy']);
    });
  });

  describe('Sorting Functionality', () => {
    it('should handle sort changes', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.handleSortChange('tittel');
        result.current.handleSortOrderChange('asc');
      });
      
      expect(result.current.sortBy).toBe('tittel');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.page).toBe(1);
    });
  });

  describe('View Mode and UI State', () => {
    it('should handle view mode changes', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.setViewMode('card');
        result.current.setGroupByEmne(false);
        result.current.setShowMerknader(true);
      });
      
      expect(result.current.viewMode).toBe('card');
      expect(result.current.groupByEmne).toBe(false);
      expect(result.current.showMerknader).toBe(true);
    });

    it('should handle group collapse toggle', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.toggleGroupCollapse('emne-1');
      });
      
      expect(result.current.collapsedGroups.has('emne-1')).toBe(true);
      
      act(() => {
        result.current.toggleGroupCollapse('emne-1');
      });
      
      expect(result.current.collapsedGroups.has('emne-1')).toBe(false);
    });
  });

  describe('Entity Actions', () => {
    it('should handle create new entity', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      const mockUser = { id: 'user1', enhetId: 'enhet1' };
      
      act(() => {
        result.current.initializeWorkspace('krav', { title: 'Krav' });
        result.current.handleCreateNew(mockUser);
      });
      
      expect(result.current.selectedEntity).toBeDefined();
      expect(result.current.selectedEntity.id).toBe('create-new');
      expect(result.current.selectedEntity.isNew).toBe(true);
      expect(result.current.selectedEntity.createdBy).toBe('user1');
    });

    it('should handle active entity changes', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      const testEntity = { id: 'test-1', tittel: 'Test Entity' };
      
      act(() => {
        result.current.setActiveEntity(testEntity);
        result.current.setSelectedEntity(testEntity);
      });
      
      expect(result.current.activeEntity).toBe(testEntity);
      expect(result.current.selectedEntity).toBe(testEntity);
    });
  });

  describe('Toast Notifications', () => {
    it('should show and hide toast messages', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      act(() => {
        result.current.showToast('Test message', 'success');
      });
      
      expect(result.current.toast.show).toBe(true);
      expect(result.current.toast.message).toBe('Test message');
      expect(result.current.toast.type).toBe('success');
      
      act(() => {
        result.current.hideToast();
      });
      
      expect(result.current.toast.show).toBe(false);
      expect(result.current.toast.message).toBe('');
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useEntityWorkspaceStore());
      
      // Make some changes
      act(() => {
        result.current.initializeWorkspace('krav', { title: 'Krav' });
        result.current.handleSearchInputChange('test');
        result.current.handleFilterChange('obligatorisk');
      });
      
      // Verify changes
      expect(result.current.currentEntityType).toBe('krav');
      expect(result.current.searchInput).toBe('test');
      expect(result.current.filterBy).toBe('obligatorisk');
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      // Verify reset
      expect(result.current.currentEntityType).toBeNull();
      expect(result.current.searchInput).toBe('');
      expect(result.current.filterBy).toBe('all');
    });
  });
});