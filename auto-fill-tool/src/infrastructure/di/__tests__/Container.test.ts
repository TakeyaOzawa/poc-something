/**
 * Unit Tests: DIContainer
 */

import { DIContainer } from '../Container';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('register and resolve', () => {
    it('should register and resolve transient service', () => {
      const factory = jest.fn(() => ({ id: Math.random() }));

      container.register('TestService', factory, 'transient');

      const instance1 = container.resolve('TestService');
      const instance2 = container.resolve('TestService');

      expect(factory).toHaveBeenCalledTimes(2);
      expect(instance1).not.toBe(instance2);
    });

    it('should register and resolve singleton service', () => {
      const factory = jest.fn(() => ({ id: Math.random() }));

      container.register('TestService', factory, 'singleton');

      const instance1 = container.resolve('TestService');
      const instance2 = container.resolve('TestService');

      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('should default to transient lifecycle', () => {
      const factory = jest.fn(() => ({ id: Math.random() }));

      container.register('TestService', factory);

      const instance1 = container.resolve('TestService');
      const instance2 = container.resolve('TestService');

      expect(factory).toHaveBeenCalledTimes(2);
      expect(instance1).not.toBe(instance2);
    });

    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('UnknownService')).toThrow(
        'Service not registered: UnknownService'
      );
    });
  });

  describe('registerInstance', () => {
    it('should register and resolve instance', () => {
      const instance = { id: 'test' };

      container.registerInstance('TestInstance', instance);

      const resolved = container.resolve('TestInstance');

      expect(resolved).toBe(instance);
    });

    it('should prioritize instance over factory', () => {
      const instance = { id: 'instance' };
      const factory = jest.fn(() => ({ id: 'factory' }));

      container.register('TestService', factory);
      container.registerInstance('TestService', instance);

      const resolved = container.resolve('TestService');

      expect(resolved).toBe(instance);
      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      container.register('TestService', () => ({}));

      expect(container.has('TestService')).toBe(true);
    });

    it('should return true for registered instance', () => {
      container.registerInstance('TestInstance', {});

      expect(container.has('TestInstance')).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(container.has('UnknownService')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all services and instances', () => {
      container.register('TestService', () => ({}));
      container.registerInstance('TestInstance', {});

      container.clear();

      expect(container.has('TestService')).toBe(false);
      expect(container.has('TestInstance')).toBe(false);
    });
  });
});
