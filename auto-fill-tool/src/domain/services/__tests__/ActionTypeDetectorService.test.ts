/**
 * Tests for ActionTypeDetectorService
 */

import { ActionTypeDetectorService, ElementInfo } from '../ActionTypeDetectorService';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ActionTypeDetectorService', () => {
  describe('determineActionType', () => {
    it('should return CLICK when elementInfo is undefined', () => {
      const result = ActionTypeDetectorService.determineActionType(undefined);
      expect(result).toBe(ACTION_TYPE.CLICK);
    });

    it('should return CLICK when tagName is missing', () => {
      const elementInfo: ElementInfo = { type: 'text' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CLICK);
    });

    it('should return SELECT_VALUE for select elements', () => {
      const elementInfo: ElementInfo = { tagName: 'select' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.SELECT_VALUE);
    });

    it('should return SELECT_VALUE for SELECT elements (uppercase)', () => {
      const elementInfo: ElementInfo = { tagName: 'SELECT' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.SELECT_VALUE);
    });

    it('should return CHECK for input[type=checkbox]', () => {
      const elementInfo: ElementInfo = { tagName: 'input', type: 'checkbox' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CHECK);
    });

    it('should return CHECK for input[type=radio]', () => {
      const elementInfo: ElementInfo = { tagName: 'input', type: 'radio' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CHECK);
    });

    it('should return CHECK for INPUT[type=CHECKBOX] (uppercase)', () => {
      const elementInfo: ElementInfo = { tagName: 'INPUT', type: 'CHECKBOX' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CHECK);
    });

    it('should return TYPE for textarea elements', () => {
      const elementInfo: ElementInfo = { tagName: 'textarea' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.TYPE);
    });

    it('should return TYPE for input[type=text]', () => {
      const elementInfo: ElementInfo = { tagName: 'input', type: 'text' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.TYPE);
    });

    it('should return TYPE for input[type=password]', () => {
      const elementInfo: ElementInfo = { tagName: 'input', type: 'password' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.TYPE);
    });

    it('should return TYPE for input[type=email]', () => {
      const elementInfo: ElementInfo = { tagName: 'input', type: 'email' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.TYPE);
    });

    it('should return TYPE for input without type attribute', () => {
      const elementInfo: ElementInfo = { tagName: 'input' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.TYPE);
    });

    it('should return CLICK for button elements', () => {
      const elementInfo: ElementInfo = { tagName: 'button' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CLICK);
    });

    it('should return CLICK for a elements', () => {
      const elementInfo: ElementInfo = { tagName: 'a' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CLICK);
    });

    it('should return CLICK for div elements', () => {
      const elementInfo: ElementInfo = { tagName: 'div' };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CLICK);
    });

    it('should handle additional properties in ElementInfo', () => {
      const elementInfo: ElementInfo = {
        tagName: 'button',
        type: 'submit',
        id: 'submit-btn',
        className: 'btn-primary',
      };
      const result = ActionTypeDetectorService.determineActionType(elementInfo);
      expect(result).toBe(ACTION_TYPE.CLICK);
    });
  });
});
