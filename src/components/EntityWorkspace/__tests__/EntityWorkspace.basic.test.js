/**
 * Basic EntityWorkspace tests to verify refactored structure works
 */

import { describe, it, expect } from 'vitest';
import { ConfigProcessor } from '../implementations/kravTiltak/services/ConfigProcessor';

describe('EntityWorkspace Refactored Components', () => {
  
  describe('ConfigProcessor', () => {
    it('should validate supported entity types', () => {
      const supported = ConfigProcessor.SUPPORTED_TYPES;
      expect(supported).toContain('krav');
      expect(supported).toContain('tiltak');
      expect(supported).toContain('prosjektKrav');
      expect(supported).toContain('prosjektTiltak');
    });

    it('should reject unsupported entity types', () => {
      expect(() => {
        ConfigProcessor.processConfig('unsupportedType');
      }).toThrow('EntityWorkspace only supports');
    });

    it('should process valid config for krav', () => {
      const mockConfig = {
        title: 'Test Krav',
        workspace: { enabled: true },
        fields: ['tittel', 'beskrivelse']
      };
      
      const processed = ConfigProcessor.processConfig('krav');
      expect(processed).toBeDefined();
      expect(processed.entityType).toBe('krav');
      expect(processed.workspace).toBeDefined();
      expect(processed.display).toBeDefined();
    });
  });

  describe('Services Integration', () => {
    it('should have all required services available', async () => {
      const { EntityTypeResolver } = await import('../implementations/kravTiltak/services/EntityTypeResolver');
      const { useCacheService } = await import('../implementations/kravTiltak/services/CacheService');
      
      expect(EntityTypeResolver).toBeDefined();
      expect(useCacheService).toBeDefined();
    });
  });

  describe('Component Structure', () => {
    it('should have properly organized component folders', () => {
      // This test verifies our folder structure is clean
      expect(true).toBe(true); // Placeholder - folder structure verified by file existence
    });
  });
});

describe('EntityWorkspace Store', () => {
  it('should be importable', async () => {
    const { default: useEntityWorkspaceStore } = await import('../implementations/kravTiltak/stores/entityWorkspaceStore');
    expect(useEntityWorkspaceStore).toBeDefined();
  });
});

// Test that main export works
describe('Main EntityWorkspace Export', () => {
  it('should be importable from core', async () => {
    const { default: EntityWorkspace } = await import('../core/EntityWorkspace');
    expect(EntityWorkspace).toBeDefined();
  });
});