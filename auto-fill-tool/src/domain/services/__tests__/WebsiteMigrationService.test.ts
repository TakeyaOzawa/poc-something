/**
 * Unit Tests: WebsiteMigrationService
 */

import { WebsiteMigrationService } from '../WebsiteMigrationService';
import { WebsiteData } from '@domain/entities/Website';

describe('WebsiteMigrationService', () => {
  let service: WebsiteMigrationService;

  beforeEach(() => {
    service = new WebsiteMigrationService();
  });

  const createMockWebsite = (overrides: Partial<WebsiteData> = {}): WebsiteData => ({
    id: 'website-1',
    name: 'Test Website',
    updatedAt: '2024-01-02T00:00:00.000Z',
    editable: true,
    startUrl: 'https://example.com',
    ...overrides,
  });

  describe('migrateWebsite', () => {
    it('should not change website with all fields present', () => {
      const website = createMockWebsite();
      const result = service.migrateWebsite(website);

      expect(result.changed).toBe(false);
      expect(result.migrated).toEqual(website);
    });

    it('should add updatedAt when missing', () => {
      const website = createMockWebsite({ updatedAt: undefined as any });
      const beforeMigration = Date.now();

      const result = service.migrateWebsite(website);

      expect(result.changed).toBe(true);
      expect(result.migrated.updatedAt).toBeDefined();

      const updatedAtTime = new Date(result.migrated.updatedAt!).getTime();
      expect(updatedAtTime).toBeGreaterThanOrEqual(beforeMigration);
      expect(updatedAtTime).toBeLessThanOrEqual(Date.now());
    });

    it('should add editable=true when missing', () => {
      const website = createMockWebsite({ editable: undefined });
      const result = service.migrateWebsite(website);

      expect(result.changed).toBe(true);
      expect(result.migrated.editable).toBe(true);
    });

    it('should add both updatedAt and editable when both missing', () => {
      const website = createMockWebsite({
        updatedAt: undefined as any,
        editable: undefined,
      });

      const result = service.migrateWebsite(website);

      expect(result.changed).toBe(true);
      expect(result.migrated.updatedAt).toBeDefined();
      expect(result.migrated.editable).toBe(true);
    });

    it('should preserve existing updatedAt', () => {
      const website = createMockWebsite({ updatedAt: '2024-01-01T00:00:00.000Z' });
      const result = service.migrateWebsite(website);

      expect(result.changed).toBe(false);
      expect(result.migrated.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should preserve existing editable=false', () => {
      const website = createMockWebsite({ editable: false });
      const result = service.migrateWebsite(website);

      expect(result.changed).toBe(false);
      expect(result.migrated.editable).toBe(false);
    });

    it('should not mutate original website object', () => {
      const website = createMockWebsite({ updatedAt: undefined as any });
      const originalWebsite = { ...website };

      service.migrateWebsite(website);

      expect(website).toEqual(originalWebsite);
    });

    it('should preserve all other fields', () => {
      const website = createMockWebsite({
        id: 'test-id',
        name: 'Test Name',
        startUrl: 'https://test.com',
        updatedAt: undefined as any,
      });

      const result = service.migrateWebsite(website);

      expect(result.migrated.id).toBe('test-id');
      expect(result.migrated.name).toBe('Test Name');
      expect(result.migrated.startUrl).toBe('https://test.com');
    });
  });

  describe('migrateWebsites', () => {
    it('should migrate multiple websites', () => {
      const websites = [
        createMockWebsite({ id: '1', updatedAt: undefined as any }),
        createMockWebsite({ id: '2', editable: undefined }),
        createMockWebsite({ id: '3' }),
      ];

      const result = service.migrateWebsites(websites);

      expect(result.changed).toBe(true);
      expect(result.migrated).toHaveLength(3);
      expect(result.migrated[0].updatedAt).toBeDefined();
      expect(result.migrated[1].editable).toBe(true);
      expect(result.migrated[2]).toEqual(websites[2]);
    });

    it('should return changed=false when no changes needed', () => {
      const websites = [createMockWebsite({ id: '1' }), createMockWebsite({ id: '2' })];

      const result = service.migrateWebsites(websites);

      expect(result.changed).toBe(false);
      expect(result.migrated).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const result = service.migrateWebsites([]);

      expect(result.changed).toBe(false);
      expect(result.migrated).toEqual([]);
    });

    it('should not mutate original array', () => {
      const websites = [createMockWebsite({ updatedAt: undefined as any })];
      const originalWebsites = [...websites];

      service.migrateWebsites(websites);

      expect(websites).toEqual(originalWebsites);
    });
  });

  describe('needsMigration', () => {
    it('should return true when updatedAt is missing', () => {
      const website = createMockWebsite({ updatedAt: undefined as any });
      expect(service.needsMigration(website)).toBe(true);
    });

    it('should return true when editable is missing', () => {
      const website = createMockWebsite({ editable: undefined });
      expect(service.needsMigration(website)).toBe(true);
    });

    it('should return true when both are missing', () => {
      const website = createMockWebsite({
        updatedAt: undefined as any,
        editable: undefined,
      });
      expect(service.needsMigration(website)).toBe(true);
    });

    it('should return false when all fields are present', () => {
      const website = createMockWebsite();
      expect(service.needsMigration(website)).toBe(false);
    });

    it('should return false when editable is explicitly false', () => {
      const website = createMockWebsite({ editable: false });
      expect(service.needsMigration(website)).toBe(false);
    });
  });

  describe('getMissingFields', () => {
    it('should return empty array when no fields are missing', () => {
      const website = createMockWebsite();
      const missing = service.getMissingFields(website);

      expect(missing).toEqual([]);
    });

    it('should return updatedAt when missing', () => {
      const website = createMockWebsite({ updatedAt: undefined as any });
      const missing = service.getMissingFields(website);

      expect(missing).toEqual(['updatedAt']);
    });

    it('should return editable when missing', () => {
      const website = createMockWebsite({ editable: undefined });
      const missing = service.getMissingFields(website);

      expect(missing).toEqual(['editable']);
    });

    it('should return both when both are missing', () => {
      const website = createMockWebsite({
        updatedAt: undefined as any,
        editable: undefined,
      });
      const missing = service.getMissingFields(website);

      expect(missing).toContain('updatedAt');
      expect(missing).toContain('editable');
      expect(missing).toHaveLength(2);
    });
  });

  describe('getMigrationStats', () => {
    it('should return correct stats for mixed data', () => {
      const websites = [
        createMockWebsite({ id: '1' }), // No migration needed
        createMockWebsite({ id: '2', updatedAt: undefined as any }), // Missing updatedAt
        createMockWebsite({ id: '3', editable: undefined }), // Missing editable
        createMockWebsite({ id: '4', updatedAt: undefined as any, editable: undefined }), // Both missing
        createMockWebsite({ id: '5' }), // No migration needed
      ];

      const stats = service.getMigrationStats(websites);

      expect(stats.total).toBe(5);
      expect(stats.needsMigration).toBe(3);
      expect(stats.missingUpdatedAt).toBe(2);
      expect(stats.missingEditable).toBe(2);
    });

    it('should return all zeros for fully migrated data', () => {
      const websites = [createMockWebsite({ id: '1' }), createMockWebsite({ id: '2' })];

      const stats = service.getMigrationStats(websites);

      expect(stats.total).toBe(2);
      expect(stats.needsMigration).toBe(0);
      expect(stats.missingUpdatedAt).toBe(0);
      expect(stats.missingEditable).toBe(0);
    });

    it('should handle empty array', () => {
      const stats = service.getMigrationStats([]);

      expect(stats.total).toBe(0);
      expect(stats.needsMigration).toBe(0);
      expect(stats.missingUpdatedAt).toBe(0);
      expect(stats.missingEditable).toBe(0);
    });

    it('should count correctly when all websites need migration', () => {
      const websites = [
        createMockWebsite({ id: '1', updatedAt: undefined as any, editable: undefined }),
        createMockWebsite({ id: '2', updatedAt: undefined as any, editable: undefined }),
      ];

      const stats = service.getMigrationStats(websites);

      expect(stats.total).toBe(2);
      expect(stats.needsMigration).toBe(2);
      expect(stats.missingUpdatedAt).toBe(2);
      expect(stats.missingEditable).toBe(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete migration workflow', () => {
      const websites = [
        createMockWebsite({ id: '1', updatedAt: undefined as any }),
        createMockWebsite({ id: '2', editable: undefined }),
        createMockWebsite({ id: '3' }),
      ];

      // Check stats before migration
      const statsBefore = service.getMigrationStats(websites);
      expect(statsBefore.needsMigration).toBe(2);

      // Perform migration
      const result = service.migrateWebsites(websites);
      expect(result.changed).toBe(true);

      // Check stats after migration
      const statsAfter = service.getMigrationStats(result.migrated);
      expect(statsAfter.needsMigration).toBe(0);

      // Verify individual websites
      expect(service.needsMigration(result.migrated[0])).toBe(false);
      expect(service.needsMigration(result.migrated[1])).toBe(false);
      expect(service.needsMigration(result.migrated[2])).toBe(false);
    });
  });
});
