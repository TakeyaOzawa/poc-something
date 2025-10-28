/**
 * Unit Tests: StepValidationService
 */

import { StepValidationService } from '../StepValidationService';
import { VariableCollection } from '@domain/entities/Variable';
import { XPathData } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { EVENT_PATTERN } from '@domain/constants/EventPattern';
import { COMPARISON_PATTERN } from '@domain/constants/ComparisonPattern';
import { SELECT_PATTERN } from '@domain/constants/SelectPattern';
import { RETRY_TYPE } from '@domain/constants/RetryType';

describe('StepValidationService', () => {
  let service: StepValidationService;
  let variables: VariableCollection;

  beforeEach(() => {
    service = new StepValidationService();
    variables = new VariableCollection();
  });

  describe('validateStepBeforeExecution', () => {
    it('should succeed for valid TYPE action step', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test input',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input[@id="test"]',
        pathAbsolute: '/html/body/input[@id="test"]',
        pathSmart: '//input[@id="test"]',
        actionPattern: EVENT_PATTERN.FRAMEWORK_AGNOSTIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateStepBeforeExecution(xpath, variables);
      expect(result.isValid()).toBe(true);
    });

    it('should fail when XPath pattern is invalid', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '', // Empty smart path
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateStepBeforeExecution(xpath, variables);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('pathSmart is required');
    });

    it('should fail when action type compatibility is invalid', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: COMPARISON_PATTERN.GREATER_THAN, // Wrong pattern for TYPE (30 is not EVENT_PATTERN)
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateStepBeforeExecution(xpath, variables);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('actionPattern must be EVENT_PATTERN');
    });

    it('should fail when required fields are missing', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Empty value for TYPE action
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateStepBeforeExecution(xpath, variables);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('value is required for TYPE action');
    });

    it('should fail when execution configuration is invalid', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: -1, // Invalid timeout
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateStepBeforeExecution(xpath, variables);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('executionTimeoutSeconds must be a positive number');
    });
  });

  describe('validateXPathPattern', () => {
    it('should succeed when pathShort is valid for selectedPathPattern "short"', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'short',
        pathShort: '//button[@id="submit"]',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail when pathShort is empty for selectedPathPattern "short"', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'short',
        pathShort: '', // Empty
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('pathShort is required when selectedPathPattern is "short"');
    });

    it('should succeed when pathAbsolute is valid for selectedPathPattern "absolute"', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'absolute',
        pathShort: '//button',
        pathAbsolute: '/html/body/button[@id="submit"]',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail when pathAbsolute is empty for selectedPathPattern "absolute"', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'absolute',
        pathShort: '//button',
        pathAbsolute: '', // Empty
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe(
        'pathAbsolute is required when selectedPathPattern is "absolute"'
      );
    });

    it('should succeed when pathSmart is valid for selectedPathPattern "smart"', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button[@id="submit"]',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail when pathSmart is empty for selectedPathPattern "smart"', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '', // Empty
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('pathSmart is required when selectedPathPattern is "smart"');
    });

    it('should fail when selectedPathPattern is invalid', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'invalid' as any,
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateXPathPattern(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('Invalid selectedPathPattern');
    });
  });

  describe('validateActionTypeCompatibility', () => {
    it('should succeed for TYPE action with EVENT_PATTERN.BASIC', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for CLICK action with EVENT_PATTERN.FRAMEWORK_AGNOSTIC', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.FRAMEWORK_AGNOSTIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for TYPE action with invalid pattern', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: 99, // Invalid
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('actionPattern must be EVENT_PATTERN');
    });

    it('should succeed for JUDGE action with COMPARISON_PATTERN.EQUALS', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'expected',
        actionType: ACTION_TYPE.JUDGE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: COMPARISON_PATTERN.EQUALS,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for JUDGE action with COMPARISON_PATTERN.GREATER_THAN', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '100',
        actionType: ACTION_TYPE.JUDGE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: COMPARISON_PATTERN.GREATER_THAN,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for JUDGE action with invalid pattern', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'expected',
        actionType: ACTION_TYPE.JUDGE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: 99, // Invalid
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('actionPattern must be COMPARISON_PATTERN');
    });

    it('should succeed for SELECT_VALUE action with SELECT_PATTERN.NATIVE_SINGLE', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'option1',
        actionType: ACTION_TYPE.SELECT_VALUE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//select',
        pathAbsolute: '/html/body/select',
        pathSmart: '//select',
        actionPattern: SELECT_PATTERN.NATIVE_SINGLE,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for SELECT_TEXT action with SELECT_PATTERN.CUSTOM_MULTIPLE', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'Option Text',
        actionType: ACTION_TYPE.SELECT_TEXT,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//select',
        pathAbsolute: '/html/body/select',
        pathSmart: '//select',
        actionPattern: SELECT_PATTERN.CUSTOM_MULTIPLE,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for SELECT_VALUE action with invalid pattern', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'option1',
        actionType: ACTION_TYPE.SELECT_VALUE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//select',
        pathAbsolute: '/html/body/select',
        pathSmart: '//select',
        actionPattern: 99, // Invalid
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('actionPattern must be SELECT_PATTERN');
    });

    it('should succeed for CHANGE_URL action with any actionPattern', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'https://example.com/page2',
        actionType: ACTION_TYPE.CHANGE_URL,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '',
        pathAbsolute: '',
        pathSmart: '',
        actionPattern: 0, // Not used for CHANGE_URL
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for SCREENSHOT action with any actionPattern', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '',
        actionType: ACTION_TYPE.SCREENSHOT,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: 0, // Not used for SCREENSHOT
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for GET_VALUE action with any actionPattern', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'outputVar',
        actionType: ACTION_TYPE.GET_VALUE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: 0, // Not used for GET_VALUE
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for invalid actionType', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: 'invalid_action' as any,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: 10,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateActionTypeCompatibility(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('Invalid actionType');
    });
  });

  describe('validateRequiredFields', () => {
    it('should succeed for TYPE action with non-empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test input',
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for TYPE action with empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Empty
        actionType: ACTION_TYPE.TYPE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('value is required for TYPE action');
    });

    it('should succeed for SELECT_VALUE action with non-empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'option1',
        actionType: ACTION_TYPE.SELECT_VALUE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//select',
        pathAbsolute: '/html/body/select',
        pathSmart: '//select',
        actionPattern: SELECT_PATTERN.NATIVE_SINGLE,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for SELECT_TEXT action with empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Empty
        actionType: ACTION_TYPE.SELECT_TEXT,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//select',
        pathAbsolute: '/html/body/select',
        pathSmart: '//select',
        actionPattern: SELECT_PATTERN.CUSTOM_SINGLE,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('value is required for');
    });

    it('should succeed for JUDGE action with non-empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'expected value',
        actionType: ACTION_TYPE.JUDGE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: COMPARISON_PATTERN.EQUALS,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for JUDGE action with empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Empty
        actionType: ACTION_TYPE.JUDGE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: COMPARISON_PATTERN.EQUALS,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('value (comparison target) is required for JUDGE action');
    });

    it('should succeed for CHANGE_URL action with valid HTTP URL', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'http://example.com/page2',
        actionType: ACTION_TYPE.CHANGE_URL,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '',
        pathAbsolute: '',
        pathSmart: '',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for CHANGE_URL action with valid HTTPS URL', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'https://example.com/page2',
        actionType: ACTION_TYPE.CHANGE_URL,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '',
        pathAbsolute: '',
        pathSmart: '',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for CHANGE_URL action with empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Empty
        actionType: ACTION_TYPE.CHANGE_URL,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '',
        pathAbsolute: '',
        pathSmart: '',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('value (URL) is required for CHANGE_URL action');
    });

    it('should fail for CHANGE_URL action with invalid URL', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'not-a-url', // Invalid
        actionType: ACTION_TYPE.CHANGE_URL,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '',
        pathAbsolute: '',
        pathSmart: '',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('value must be a valid URL');
    });

    it('should succeed for GET_VALUE action with non-empty variable name', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'outputVariable',
        actionType: ACTION_TYPE.GET_VALUE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail for GET_VALUE action with empty value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Empty
        actionType: ACTION_TYPE.GET_VALUE,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('value (variable name) is required for GET_VALUE action');
    });

    it('should succeed for CLICK action without value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Not required for CLICK
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for CHECK action without value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Not required for CHECK
        actionType: ACTION_TYPE.CHECK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input[@type="checkbox"]',
        pathAbsolute: '/html/body/input',
        pathSmart: '//input[@type="checkbox"]',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed for SCREENSHOT action without value', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: '', // Not required for SCREENSHOT
        actionType: ACTION_TYPE.SCREENSHOT,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//div',
        pathAbsolute: '/html/body/div',
        pathSmart: '//div',
        actionPattern: 0,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateRequiredFields(xpath);
      expect(result.isValid()).toBe(true);
    });
  });

  describe('validateExecutionConfiguration', () => {
    it('should succeed with valid execution configuration', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 2,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail when executionTimeoutSeconds is zero', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 0, // Invalid
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('executionTimeoutSeconds must be a positive number');
    });

    it('should fail when executionTimeoutSeconds is negative', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: -10, // Invalid
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('executionTimeoutSeconds must be a positive number');
    });

    it('should fail when afterWaitSeconds is negative', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: -5, // Invalid
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('afterWaitSeconds must be a non-negative number');
    });

    it('should succeed when afterWaitSeconds is zero', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0, // Valid
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.NO_RETRY,
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should succeed with RETRY_FROM_BEGINNING', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: RETRY_TYPE.RETRY_FROM_BEGINNING,
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(true);
    });

    it('should fail with invalid retryType', () => {
      const xpath: XPathData = {
        id: 'test-1',
        websiteId: 'site-1',
        value: 'test',
        actionType: ACTION_TYPE.CLICK,
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '//button',
        actionPattern: EVENT_PATTERN.BASIC,
        afterWaitSeconds: 0,
        executionTimeoutSeconds: 30,
        retryType: 999 as any, // Invalid
      };

      const result = service.validateExecutionConfiguration(xpath);
      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('Invalid retryType');
    });
  });
});
