/**
 * Unit Tests: VariableSubstitutionService
 */

import { VariableSubstitutionService } from '../VariableSubstitutionService';
import { VariableCollection } from '@domain/entities/Variable';
import { XPathData } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { RETRY_TYPE } from '@domain/constants/RetryType';

describe('VariableSubstitutionService', () => {
  let service: VariableSubstitutionService;
  let variables: VariableCollection;

  beforeEach(() => {
    service = new VariableSubstitutionService();
    variables = new VariableCollection();
  });

  describe('replaceVariables', () => {
    it('should replace single variable reference', () => {
      variables.add({ name: 'username', value: 'john' });
      const result = service.replaceVariables('Hello {{username}}!', variables);
      expect(result).toBe('Hello john!');
    });

    it('should replace multiple variable references', () => {
      variables.add({ name: 'first', value: 'John' });
      variables.add({ name: 'last', value: 'Doe' });
      const result = service.replaceVariables('{{first}} {{last}}', variables);
      expect(result).toBe('John Doe');
    });

    it('should replace multiple occurrences of same variable', () => {
      variables.add({ name: 'user', value: 'admin' });
      const result = service.replaceVariables('{{user}} and {{user}}', variables);
      expect(result).toBe('admin and admin');
    });

    it('should return unchanged text when no variables defined', () => {
      const result = service.replaceVariables('{{username}}', variables);
      expect(result).toBe('{{username}}');
    });

    it('should return unchanged text when no variable references', () => {
      variables.add({ name: 'username', value: 'john' });
      const result = service.replaceVariables('Hello World!', variables);
      expect(result).toBe('Hello World!');
    });

    it('should handle variable names with underscores', () => {
      variables.add({ name: 'user_name', value: 'john' });
      variables.add({ name: 'user_id', value: '123' });
      const result = service.replaceVariables('{{user_name}}: {{user_id}}', variables);
      expect(result).toBe('john: 123');
    });

    it('should handle empty string', () => {
      variables.add({ name: 'test', value: 'value' });
      const result = service.replaceVariables('', variables);
      expect(result).toBe('');
    });
  });

  describe('extractVariableReferences', () => {
    it('should extract single variable reference', () => {
      const result = service.extractVariableReferences('Hello {{username}}!');
      expect(result).toEqual(['username']);
    });

    it('should extract multiple unique variable references', () => {
      const result = service.extractVariableReferences('{{first}} {{last}} {{email}}');
      expect(result).toHaveLength(3);
      expect(result).toContain('first');
      expect(result).toContain('last');
      expect(result).toContain('email');
    });

    it('should return unique variable names (no duplicates)', () => {
      const result = service.extractVariableReferences('{{user}} and {{user}} and {{user}}');
      expect(result).toEqual(['user']);
    });

    it('should return empty array when no variable references', () => {
      const result = service.extractVariableReferences('Hello World!');
      expect(result).toEqual([]);
    });

    it('should extract variables with hyphens and underscores', () => {
      const result = service.extractVariableReferences('{{user-name}} {{user_id}}');
      expect(result).toHaveLength(2);
      expect(result).toContain('user-name');
      expect(result).toContain('user_id');
    });

    it('should handle empty string', () => {
      const result = service.extractVariableReferences('');
      expect(result).toEqual([]);
    });
  });

  describe('validateVariableReferences', () => {
    it('should succeed when all referenced variables are defined', () => {
      variables.add({ name: 'username', value: 'john' });
      variables.add({ name: 'password', value: 'secret' });
      const result = service.validateVariableReferences('{{username}}: {{password}}', variables);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed when no variable references', () => {
      const result = service.validateVariableReferences('Hello World!', variables);
      expect(result.isValid()).toBe(true);
    });

    it('should fail when referenced variable is undefined', () => {
      variables.add({ name: 'username', value: 'john' });
      const result = service.validateVariableReferences('{{username}} {{missing}}', variables);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('Undefined variables: missing');
    });

    it('should fail with multiple undefined variables', () => {
      variables.add({ name: 'defined', value: 'value' });
      const result = service.validateVariableReferences(
        '{{defined}} {{missing1}} {{missing2}}',
        variables
      );
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('missing1');
      expect(result.getError()).toContain('missing2');
    });

    it('should handle empty string', () => {
      const result = service.validateVariableReferences('', variables);
      expect(result.isValid()).toBe(true);
    });
  });

  describe('replaceInXPathData', () => {
    it('should replace variables in all XPathData fields', () => {
      variables.add({ name: 'userId', value: '123' });
      variables.add({ name: 'action', value: 'submit' });

      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'User ID: {{userId}}',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com/{{userId}}',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input[@id="{{action}}"]',
        pathAbsolute: '/html/body/input[@id="{{action}}"]',
        pathSmart: '//input[@id="{{action}}"]',
        actionPattern: 10,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.replaceInXPathData(xpath, variables);

      expect(result.value).toBe('User ID: 123');
      expect(result.pathShort).toBe('//input[@id="submit"]');
      expect(result.pathAbsolute).toBe('/html/body/input[@id="submit"]');
      expect(result.pathSmart).toBe('//input[@id="submit"]');
      expect(result.url).toBe('https://example.com/123');
    });

    it('should not modify other XPathData fields', () => {
      variables.add({ name: 'test', value: 'value' });

      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 5,
        selectedPathPattern: 'absolute',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: 20,
        afterWaitSeconds: 2,
        executionTimeoutSeconds: 60,
        retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
      };

      const result = service.replaceInXPathData(xpath, variables);

      expect(result.id).toBe('test-1');
      expect(result.websiteId).toBe('site-1');
      expect(result.actionType).toBe(ACTION_TYPE.CLICK);
      expect(result.executionOrder).toBe(5);
      expect(result.selectedPathPattern).toBe('absolute');
      expect(result.actionPattern).toBe(20);
      expect(result.afterWaitSeconds).toBe(2);
      expect(result.executionTimeoutSeconds).toBe(60);
      expect(result.retryType).toBe(RETRY_TYPE.RETRY_FROM_BEGINNING);
    });

    it('should return XPathData unchanged when no variable references', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test value',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: 10,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.replaceInXPathData(xpath, variables);

      expect(result.value).toBe('test value');
      expect(result.pathShort).toBe('//input');
      expect(result.pathAbsolute).toBe('/html/body/input');
      expect(result.pathSmart).toBe('//input');
      expect(result.url).toBe('https://example.com');
    });
  });

  describe('hasVariableReferences', () => {
    it('should return true when text contains variable references', () => {
      const result = service.hasVariableReferences('Hello {{username}}!');
      expect(result).toBe(true);
    });

    it('should return false when text has no variable references', () => {
      const result = service.hasVariableReferences('Hello World!');
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = service.hasVariableReferences('');
      expect(result).toBe(false);
    });
  });

  describe('countVariableReferences', () => {
    it('should return 0 for text without variable references', () => {
      const result = service.countVariableReferences('Hello World!');
      expect(result).toBe(0);
    });

    it('should return 1 for single variable reference', () => {
      const result = service.countVariableReferences('Hello {{username}}!');
      expect(result).toBe(1);
    });

    it('should count multiple occurrences of same variable', () => {
      const result = service.countVariableReferences('{{user}} and {{user}} and {{user}}');
      expect(result).toBe(3);
    });

    it('should count all variable references including duplicates', () => {
      const result = service.countVariableReferences('{{first}} {{last}} {{first}}');
      expect(result).toBe(3);
    });

    it('should return 0 for empty string', () => {
      const result = service.countVariableReferences('');
      expect(result).toBe(0);
    });
  });
});
