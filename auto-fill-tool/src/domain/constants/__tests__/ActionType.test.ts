/**
 * Unit Tests: ActionType
 */

import { ACTION_TYPE, ActionType, isActionType } from '../ActionType';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ActionType', () => {
  describe('ACTION_TYPE constants', () => {
    it('should define TYPE as "type"', () => {
      expect(ACTION_TYPE.TYPE).toBe('type');
    });

    it('should define CLICK as "click"', () => {
      expect(ACTION_TYPE.CLICK).toBe('click');
    });

    it('should define CHECK as "check"', () => {
      expect(ACTION_TYPE.CHECK).toBe('check');
    });

    it('should define JUDGE as "judge"', () => {
      expect(ACTION_TYPE.JUDGE).toBe('judge');
    });

    it('should define SELECT_VALUE as "select_value"', () => {
      expect(ACTION_TYPE.SELECT_VALUE).toBe('select_value');
    });

    it('should define SELECT_INDEX as "select_index"', () => {
      expect(ACTION_TYPE.SELECT_INDEX).toBe('select_index');
    });

    it('should define SELECT_TEXT as "select_text"', () => {
      expect(ACTION_TYPE.SELECT_TEXT).toBe('select_text');
    });

    it('should define SELECT_TEXT_EXACT as "select_text_exact"', () => {
      expect(ACTION_TYPE.SELECT_TEXT_EXACT).toBe('select_text_exact');
    });

    it('should define CHANGE_URL as "change_url"', () => {
      expect(ACTION_TYPE.CHANGE_URL).toBe('change_url');
    });

    it('should define SCREENSHOT as "screenshot"', () => {
      expect(ACTION_TYPE.SCREENSHOT).toBe('screenshot');
    });

    it('should define GET_VALUE as "get_value"', () => {
      expect(ACTION_TYPE.GET_VALUE).toBe('get_value');
    });

    it('should have all unique values', () => {
      const values = Object.values(ACTION_TYPE);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have exactly 11 action types', () => {
      const values = Object.values(ACTION_TYPE);
      expect(values.length).toBe(11);
    });
  });

  describe('ActionType type', () => {
    it('should accept valid action type values', () => {
      const type: ActionType = ACTION_TYPE.TYPE;
      const click: ActionType = ACTION_TYPE.CLICK;
      const check: ActionType = ACTION_TYPE.CHECK;
      const judge: ActionType = ACTION_TYPE.JUDGE;
      const selectValue: ActionType = ACTION_TYPE.SELECT_VALUE;
      const selectIndex: ActionType = ACTION_TYPE.SELECT_INDEX;
      const selectText: ActionType = ACTION_TYPE.SELECT_TEXT;
      const selectTextExact: ActionType = ACTION_TYPE.SELECT_TEXT_EXACT;
      const changeUrl: ActionType = ACTION_TYPE.CHANGE_URL;
      const screenshot: ActionType = ACTION_TYPE.SCREENSHOT;
      const getValue: ActionType = ACTION_TYPE.GET_VALUE;

      expect(type).toBe('type');
      expect(click).toBe('click');
      expect(check).toBe('check');
      expect(judge).toBe('judge');
      expect(selectValue).toBe('select_value');
      expect(selectIndex).toBe('select_index');
      expect(selectText).toBe('select_text');
      expect(selectTextExact).toBe('select_text_exact');
      expect(changeUrl).toBe('change_url');
      expect(screenshot).toBe('screenshot');
      expect(getValue).toBe('get_value');
    });
  });

  describe('isActionType', () => {
    it('should return true for TYPE', () => {
      expect(isActionType('type')).toBe(true);
    });

    it('should return true for CLICK', () => {
      expect(isActionType('click')).toBe(true);
    });

    it('should return true for CHECK', () => {
      expect(isActionType('check')).toBe(true);
    });

    it('should return true for JUDGE', () => {
      expect(isActionType('judge')).toBe(true);
    });

    it('should return true for SELECT_VALUE', () => {
      expect(isActionType('select_value')).toBe(true);
    });

    it('should return true for SELECT_INDEX', () => {
      expect(isActionType('select_index')).toBe(true);
    });

    it('should return true for SELECT_TEXT', () => {
      expect(isActionType('select_text')).toBe(true);
    });

    it('should return true for SELECT_TEXT_EXACT', () => {
      expect(isActionType('select_text_exact')).toBe(true);
    });

    it('should return true for CHANGE_URL', () => {
      expect(isActionType('change_url')).toBe(true);
    });

    it('should return true for SCREENSHOT', () => {
      expect(isActionType('screenshot')).toBe(true);
    });

    it('should return true for GET_VALUE', () => {
      expect(isActionType('get_value')).toBe(true);
    });

    it('should return false for invalid action type', () => {
      expect(isActionType('invalid')).toBe(false);
    });

    it('should return false for old action type "input"', () => {
      expect(isActionType('input')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isActionType('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isActionType('Type')).toBe(false);
      expect(isActionType('CLICK')).toBe(false);
      expect(isActionType('Check')).toBe(false);
    });

    it('should work with constant values', () => {
      expect(isActionType(ACTION_TYPE.TYPE)).toBe(true);
      expect(isActionType(ACTION_TYPE.CLICK)).toBe(true);
      expect(isActionType(ACTION_TYPE.CHECK)).toBe(true);
      expect(isActionType(ACTION_TYPE.JUDGE)).toBe(true);
      expect(isActionType(ACTION_TYPE.SELECT_VALUE)).toBe(true);
      expect(isActionType(ACTION_TYPE.SELECT_INDEX)).toBe(true);
      expect(isActionType(ACTION_TYPE.SELECT_TEXT)).toBe(true);
      expect(isActionType(ACTION_TYPE.SELECT_TEXT_EXACT)).toBe(true);
      expect(isActionType(ACTION_TYPE.CHANGE_URL)).toBe(true);
      expect(isActionType(ACTION_TYPE.SCREENSHOT)).toBe(true);
      expect(isActionType(ACTION_TYPE.GET_VALUE)).toBe(true);
    });

    it('should handle all valid action types in a loop', () => {
      const validTypes = Object.values(ACTION_TYPE);
      validTypes.forEach((type) => {
        expect(isActionType(type)).toBe(true);
      });
    });

    it('should be used for runtime validation', () => {
      const actionType = 'type';

      if (isActionType(actionType)) {
        expect(actionType).toBe(ACTION_TYPE.TYPE);
      } else {
        fail('Should be a valid action type');
      }
    });

    it('should validate action types from external sources', () => {
      const externalTypes = ['type', 'invalid', 'click', 'input', 'check'];

      const validTypes = externalTypes.filter(isActionType);

      expect(validTypes).toHaveLength(3);
      expect(validTypes).toContain('type');
      expect(validTypes).toContain('click');
      expect(validTypes).toContain('check');
      expect(validTypes).not.toContain('invalid');
      expect(validTypes).not.toContain('input'); // Old action type
    });
  });

  describe('usage scenarios', () => {
    it('should support text input with TYPE', () => {
      const actionType = ACTION_TYPE.TYPE;
      expect(actionType).toBe('type');
      expect(isActionType(actionType)).toBe(true);
    });

    it('should support checkbox/radio operations with CHECK', () => {
      const actionType = ACTION_TYPE.CHECK;
      expect(actionType).toBe('check');
      expect(isActionType(actionType)).toBe(true);
    });

    it('should support value comparison with JUDGE', () => {
      const actionType = ACTION_TYPE.JUDGE;
      expect(actionType).toBe('judge');
      expect(isActionType(actionType)).toBe(true);
    });

    it('should support all select box operations', () => {
      const selectTypes = [
        ACTION_TYPE.SELECT_VALUE,
        ACTION_TYPE.SELECT_INDEX,
        ACTION_TYPE.SELECT_TEXT,
        ACTION_TYPE.SELECT_TEXT_EXACT,
      ];

      selectTypes.forEach((type) => {
        expect(isActionType(type)).toBe(true);
        expect(type).toContain('select');
      });
    });

    it('should support URL navigation with CHANGE_URL', () => {
      const actionType = ACTION_TYPE.CHANGE_URL;
      expect(actionType).toBe('change_url');
      expect(isActionType(actionType)).toBe(true);
    });

    it('should support screenshot capture with SCREENSHOT', () => {
      const actionType = ACTION_TYPE.SCREENSHOT;
      expect(actionType).toBe('screenshot');
      expect(isActionType(actionType)).toBe(true);
    });

    it('should support value retrieval with GET_VALUE', () => {
      const actionType = ACTION_TYPE.GET_VALUE;
      expect(actionType).toBe('get_value');
      expect(isActionType(actionType)).toBe(true);
    });
  });
});
