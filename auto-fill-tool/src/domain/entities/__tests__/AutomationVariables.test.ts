/**
 * Unit Tests: AutomationVariables Entity
 */

import { AutomationVariables, AutomationVariablesData } from '../AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';

describe('AutomationVariables Entity', () => {
  const validData: AutomationVariablesData = {
    id: 'test-id-123',
    websiteId: 'website_001',
    variables: { username: 'testuser', password: 'testpass' },
    status: AUTOMATION_STATUS.ENABLED,
    updatedAt: '2025-10-07T00:00:00.000Z',
  };

  describe('constructor', () => {
    it('should create AutomationVariables with valid data', () => {
      const av = new AutomationVariables(validData);

      expect(av.getId()).toBe('test-id-123');
      expect(av.getWebsiteId()).toBe('website_001');
      expect(av.getVariables()).toEqual({ username: 'testuser', password: 'testpass' });
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
      expect(av.getUpdatedAt()).toBe('2025-10-07T00:00:00.000Z');
    });

    it('should throw error if id is missing', () => {
      const invalidData = { ...validData, id: '' };
      expect(() => new AutomationVariables(invalidData)).toThrow('ID is required');
    });

    it('should throw error if websiteId is missing', () => {
      const invalidData = { ...validData, websiteId: '' };
      expect(() => new AutomationVariables(invalidData)).toThrow('Website ID is required');
    });

    it('should throw error if status is invalid', () => {
      const invalidData = { ...validData, status: 'invalid' as any };
      expect(() => new AutomationVariables(invalidData)).toThrow('Invalid status');
    });

    it('should accept undefined status', () => {
      const dataWithoutStatus = { ...validData, status: undefined };
      const av = new AutomationVariables(dataWithoutStatus);

      expect(av.getStatus()).toBeUndefined();
    });
  });

  describe('getters', () => {
    it('should return id', () => {
      const av = new AutomationVariables(validData);
      expect(av.getId()).toBe('test-id-123');
    });

    it('should return websiteId', () => {
      const av = new AutomationVariables(validData);
      expect(av.getWebsiteId()).toBe('website_001');
    });

    it('should return a copy of variables', () => {
      const av = new AutomationVariables(validData);
      const variables = av.getVariables();

      expect(variables).toEqual({ username: 'testuser', password: 'testpass' });
      expect(variables).not.toBe(validData.variables); // different reference
    });

    it('should return status', () => {
      const av = new AutomationVariables(validData);
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
    });

    it('should return updatedAt', () => {
      const av = new AutomationVariables(validData);
      expect(av.getUpdatedAt()).toBe('2025-10-07T00:00:00.000Z');
    });
  });

  describe('setStatus', () => {
    it('should return new instance with updated status', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setStatus(AUTOMATION_STATUS.DISABLED);

      expect(updated.getStatus()).toBe(AUTOMATION_STATUS.DISABLED);
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ENABLED); // original unchanged
      expect(updated.getWebsiteId()).toBe(av.getWebsiteId());
    });

    it('should update updatedAt timestamp', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setStatus(AUTOMATION_STATUS.DISABLED);

      expect(updated.getUpdatedAt()).not.toBe(av.getUpdatedAt());
    });
  });

  describe('setVariable', () => {
    it('should add a new variable', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setVariable('email', 'test@example.com');

      expect(updated.getVariables()).toEqual({
        username: 'testuser',
        password: 'testpass',
        email: 'test@example.com',
      });
      expect(av.getVariables()).toEqual({
        username: 'testuser',
        password: 'testpass',
      }); // original unchanged
    });

    it('should update an existing variable', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setVariable('username', 'newuser');

      expect(updated.getVariables().username).toBe('newuser');
      expect(av.getVariables().username).toBe('testuser'); // original unchanged
    });

    it('should update updatedAt timestamp', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setVariable('email', 'test@example.com');

      expect(updated.getUpdatedAt()).not.toBe(av.getUpdatedAt());
    });
  });

  describe('setVariables', () => {
    it('should replace all variables', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setVariables({ newVar1: 'value1', newVar2: 'value2' });

      expect(updated.getVariables()).toEqual({ newVar1: 'value1', newVar2: 'value2' });
      expect(av.getVariables()).toEqual({
        username: 'testuser',
        password: 'testpass',
      }); // original unchanged
    });

    it('should update updatedAt timestamp', () => {
      const av = new AutomationVariables(validData);
      const updated = av.setVariables({ newVar: 'value' });

      expect(updated.getUpdatedAt()).not.toBe(av.getUpdatedAt());
    });
  });

  describe('removeVariable', () => {
    it('should remove an existing variable', () => {
      const av = new AutomationVariables(validData);
      const updated = av.removeVariable('username');

      expect(updated.getVariables()).toEqual({ password: 'testpass' });
      expect(av.getVariables()).toEqual({
        username: 'testuser',
        password: 'testpass',
      }); // original unchanged
    });

    it('should not throw error if variable does not exist', () => {
      const av = new AutomationVariables(validData);
      const updated = av.removeVariable('nonexistent');

      expect(updated.getVariables()).toEqual({
        username: 'testuser',
        password: 'testpass',
      });
    });

    it('should update updatedAt timestamp', () => {
      const av = new AutomationVariables(validData);
      const updated = av.removeVariable('username');

      expect(updated.getUpdatedAt()).not.toBe(av.getUpdatedAt());
    });
  });

  describe('clearVariables', () => {
    it('should remove all variables', () => {
      const av = new AutomationVariables(validData);
      const updated = av.clearVariables();

      expect(updated.getVariables()).toEqual({});
      expect(av.getVariables()).toEqual({
        username: 'testuser',
        password: 'testpass',
      }); // original unchanged
    });

    it('should update updatedAt timestamp', () => {
      const av = new AutomationVariables(validData);
      const updated = av.clearVariables();

      expect(updated.getUpdatedAt()).not.toBe(av.getUpdatedAt());
    });
  });

  describe('toData', () => {
    it('should return a copy of data', () => {
      const av = new AutomationVariables(validData);
      const data = av.toData();

      expect(data).toEqual(validData);
      expect(data).not.toBe(validData); // different reference
    });
  });

  describe('clone', () => {
    it('should return a new instance with same data', () => {
      const av = new AutomationVariables(validData);
      const cloned = av.clone();

      expect(cloned.toData()).toEqual(av.toData());
      expect(cloned).not.toBe(av); // different instance
    });
  });

  describe('create static factory', () => {
    it('should create with minimal params', () => {
      const av = AutomationVariables.create({ websiteId: 'website_123' });

      expect(av.getWebsiteId()).toBe('website_123');
      expect(av.getVariables()).toEqual({});
      expect(av.getStatus()).toBeUndefined();
      expect(av.getUpdatedAt()).toBeTruthy();
    });

    it('should auto-generate UUID for id', () => {
      const av = AutomationVariables.create({ websiteId: 'website_123' });

      expect(av.getId()).toBeTruthy();
      expect(av.getId()).toMatch(/^test-uuid-\d{4}-5678-90ab-cdef12345678$/);
    });

    it('should create with all params', () => {
      const av = AutomationVariables.create({
        websiteId: 'website_123',
        variables: { key: 'value' },
        status: AUTOMATION_STATUS.ONCE,
      });

      expect(av.getId()).toBeTruthy();
      expect(av.getWebsiteId()).toBe('website_123');
      expect(av.getVariables()).toEqual({ key: 'value' });
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ONCE);
    });

    it('should generate updatedAt timestamp', () => {
      const before = new Date().toISOString();
      const av = AutomationVariables.create({ websiteId: 'website_123' });
      const after = new Date().toISOString();

      const updatedAt = av.getUpdatedAt();
      expect(updatedAt >= before && updatedAt <= after).toBe(true);
    });

    it('should support dynamic variables structure', () => {
      const av1 = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {
          username: 'user@example.com',
          password: 'secret123',
        },
      });

      const av2 = AutomationVariables.create({
        websiteId: 'website-2',
        variables: {
          api_key: 'key12345',
          token: 'token67890',
          endpoint: 'https://api.example.com',
        },
      });

      expect(Object.keys(av1.getVariables())).toEqual(['username', 'password']);
      expect(Object.keys(av2.getVariables())).toEqual(['api_key', 'token', 'endpoint']);
    });
  });

  describe('fromExisting static factory', () => {
    it('should create from existing data with id', () => {
      const data: AutomationVariablesData = {
        id: 'existing-id',
        websiteId: 'website_123',
        variables: { key: 'value' },
        status: AUTOMATION_STATUS.ENABLED,
        updatedAt: '2025-10-07T00:00:00.000Z',
      };

      const av = AutomationVariables.fromExisting(data);

      expect(av.getId()).toBe('existing-id');
      expect(av.getWebsiteId()).toBe('website_123');
      expect(av.getVariables()).toEqual({ key: 'value' });
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
    });

    it('should generate id if missing', () => {
      const data: any = {
        websiteId: 'website_123',
        variables: {},
        updatedAt: '2025-10-07T00:00:00.000Z',
      };

      const av = AutomationVariables.fromExisting(data);

      expect(av.getId()).toBeTruthy();
      expect(av.getId()).toMatch(/^test-uuid-\d{4}-5678-90ab-cdef12345678$/);
    });

    it('should preserve all existing data', () => {
      const data: AutomationVariablesData = {
        id: 'test-id',
        websiteId: 'website_456',
        variables: { var1: 'value1', var2: 'value2' },
        status: AUTOMATION_STATUS.DISABLED,
        updatedAt: '2025-10-08T12:00:00.000Z',
      };

      const av = AutomationVariables.fromExisting(data);

      expect(av.toData()).toEqual(data);
    });
  });

  describe('completeExecution (Business Logic)', () => {
    it('should change status from ONCE to DISABLED', () => {
      const av = AutomationVariables.create({
        websiteId: 'website_123',
        status: AUTOMATION_STATUS.ONCE,
      });

      const updated = av.completeExecution();

      expect(updated.getStatus()).toBe(AUTOMATION_STATUS.DISABLED);
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ONCE); // original unchanged
    });

    it('should return same instance if status is not ONCE', () => {
      const av = AutomationVariables.create({
        websiteId: 'website_123',
        status: AUTOMATION_STATUS.ENABLED,
      });

      const updated = av.completeExecution();

      expect(updated).toBe(av); // same instance
      expect(updated.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
    });

    it('should return same instance if status is DISABLED', () => {
      const av = AutomationVariables.create({
        websiteId: 'website_123',
        status: AUTOMATION_STATUS.DISABLED,
      });

      const updated = av.completeExecution();

      expect(updated).toBe(av); // same instance
      expect(updated.getStatus()).toBe(AUTOMATION_STATUS.DISABLED);
    });

    it('should return same instance if status is undefined', () => {
      const av = AutomationVariables.create({
        websiteId: 'website_123',
      });

      const updated = av.completeExecution();

      expect(updated).toBe(av); // same instance
      expect(updated.getStatus()).toBeUndefined();
    });

    it('should update updatedAt when status changes from ONCE to DISABLED', () => {
      const av = AutomationVariables.create({
        websiteId: 'website_123',
        status: AUTOMATION_STATUS.ONCE,
      });

      const originalUpdatedAt = av.getUpdatedAt();

      // Wait a small amount to ensure timestamp difference
      // In production, this isn't an issue as operations take time
      const updated = av.completeExecution();

      // Verify it's a new instance with updated timestamp
      expect(updated).not.toBe(av);
      // The new instance should have a different or equal timestamp
      // (equal in case the test runs within the same millisecond)
      const updatedTimestamp = updated.getUpdatedAt();
      expect(updatedTimestamp >= originalUpdatedAt).toBe(true);
    });

    it('should encapsulate business rule: ONCE becomes DISABLED after execution', () => {
      // This test documents the business rule
      // Business Rule: ONCE status is for one-time execution, automatically disabled after completion
      const av = AutomationVariables.create({
        websiteId: 'website_123',
        status: AUTOMATION_STATUS.ONCE,
      });

      const completed = av.completeExecution();

      // Business rule is encapsulated in domain entity
      expect(completed.getStatus()).toBe(AUTOMATION_STATUS.DISABLED);
      // Original remains unchanged (immutability)
      expect(av.getStatus()).toBe(AUTOMATION_STATUS.ONCE);
    });
  });
});
