/**
 * Unit Tests: ProgressTrackingService
 */

import { ProgressTrackingService } from '../ProgressTrackingService';
import { ACTION_TYPE } from '@domain/constants/ActionType';

describe('ProgressTrackingService', () => {
  let service: ProgressTrackingService;

  beforeEach(() => {
    service = new ProgressTrackingService();
  });

  describe('calculateProgress', () => {
    it('should calculate progress with percentage', () => {
      const result = service.calculateProgress(5, 10);
      expect(result.current).toBe(5);
      expect(result.total).toBe(10);
      expect(result.percentage).toBe(50);
      expect(result.description).toBe('Processing step 5 of 10');
    });

    it('should calculate progress at 0%', () => {
      const result = service.calculateProgress(0, 10);
      expect(result.percentage).toBe(0);
    });

    it('should calculate progress at 100%', () => {
      const result = service.calculateProgress(10, 10);
      expect(result.percentage).toBe(100);
    });

    it('should handle division by zero (total = 0)', () => {
      const result = service.calculateProgress(5, 0);
      expect(result.percentage).toBe(0);
      expect(result.current).toBe(5);
      expect(result.total).toBe(0);
    });

    it('should floor percentage to integer', () => {
      const result = service.calculateProgress(1, 3);
      expect(result.percentage).toBe(33); // 33.333... -> 33
    });

    it('should include action type in description', () => {
      const result = service.calculateProgress(3, 10, ACTION_TYPE.CLICK);
      expect(result.description).toBe('Executing Click action (Step 3/10)');
    });

    it('should use custom description when provided', () => {
      const result = service.calculateProgress(3, 10, ACTION_TYPE.CLICK, 'Custom message');
      expect(result.description).toBe('Custom message');
    });

    it('should calculate progress for single step', () => {
      const result = service.calculateProgress(1, 1);
      expect(result.percentage).toBe(100);
      expect(result.description).toBe('Processing step 1 of 1');
    });
  });

  describe('shouldSaveProgress', () => {
    it('should return true for CHANGE_URL action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.CHANGE_URL);
      expect(result).toBe(true);
    });

    it('should return false for TYPE action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.TYPE);
      expect(result).toBe(false);
    });

    it('should return false for CLICK action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.CLICK);
      expect(result).toBe(false);
    });

    it('should return false for CHECK action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.CHECK);
      expect(result).toBe(false);
    });

    it('should return false for JUDGE action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.JUDGE);
      expect(result).toBe(false);
    });

    it('should return false for SELECT_VALUE action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.SELECT_VALUE);
      expect(result).toBe(false);
    });

    it('should return false for SELECT_INDEX action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.SELECT_INDEX);
      expect(result).toBe(false);
    });

    it('should return false for SELECT_TEXT action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.SELECT_TEXT);
      expect(result).toBe(false);
    });

    it('should return false for SELECT_TEXT_EXACT action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.SELECT_TEXT_EXACT);
      expect(result).toBe(false);
    });

    it('should return false for SCREENSHOT action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.SCREENSHOT);
      expect(result).toBe(false);
    });

    it('should return false for GET_VALUE action', () => {
      const result = service.shouldSaveProgress(ACTION_TYPE.GET_VALUE);
      expect(result).toBe(false);
    });

    it('should return false for unknown action type', () => {
      const result = service.shouldSaveProgress('UNKNOWN_ACTION');
      expect(result).toBe(false);
    });
  });

  describe('formatProgressMessage', () => {
    it('should format message without action type', () => {
      const result = service.formatProgressMessage(5, 10);
      expect(result).toBe('Processing step 5 of 10');
    });

    it('should format message with action type', () => {
      const result = service.formatProgressMessage(3, 10, ACTION_TYPE.TYPE);
      expect(result).toBe('Executing Type action (Step 3/10)');
    });

    it('should format message for CLICK action', () => {
      const result = service.formatProgressMessage(7, 15, ACTION_TYPE.CLICK);
      expect(result).toBe('Executing Click action (Step 7/15)');
    });

    it('should format message for first step', () => {
      const result = service.formatProgressMessage(1, 10);
      expect(result).toBe('Processing step 1 of 10');
    });

    it('should format message for last step', () => {
      const result = service.formatProgressMessage(10, 10);
      expect(result).toBe('Processing step 10 of 10');
    });

    it('should format message for CHANGE_URL action', () => {
      const result = service.formatProgressMessage(2, 5, ACTION_TYPE.CHANGE_URL);
      expect(result).toBe('Executing Navigate action (Step 2/5)');
    });
  });

  describe('getActionDescription', () => {
    it('should return "Type" for TYPE action', () => {
      expect(service.getActionDescription(ACTION_TYPE.TYPE)).toBe('Type');
    });

    it('should return "Click" for CLICK action', () => {
      expect(service.getActionDescription(ACTION_TYPE.CLICK)).toBe('Click');
    });

    it('should return "Check" for CHECK action', () => {
      expect(service.getActionDescription(ACTION_TYPE.CHECK)).toBe('Check');
    });

    it('should return "Validate" for JUDGE action', () => {
      expect(service.getActionDescription(ACTION_TYPE.JUDGE)).toBe('Validate');
    });

    it('should return "Select" for SELECT_VALUE action', () => {
      expect(service.getActionDescription(ACTION_TYPE.SELECT_VALUE)).toBe('Select');
    });

    it('should return "Select" for SELECT_INDEX action', () => {
      expect(service.getActionDescription(ACTION_TYPE.SELECT_INDEX)).toBe('Select');
    });

    it('should return "Select" for SELECT_TEXT action', () => {
      expect(service.getActionDescription(ACTION_TYPE.SELECT_TEXT)).toBe('Select');
    });

    it('should return "Select" for SELECT_TEXT_EXACT action', () => {
      expect(service.getActionDescription(ACTION_TYPE.SELECT_TEXT_EXACT)).toBe('Select');
    });

    it('should return "Navigate" for CHANGE_URL action', () => {
      expect(service.getActionDescription(ACTION_TYPE.CHANGE_URL)).toBe('Navigate');
    });

    it('should return "Screenshot" for SCREENSHOT action', () => {
      expect(service.getActionDescription(ACTION_TYPE.SCREENSHOT)).toBe('Screenshot');
    });

    it('should return "Get value" for GET_VALUE action', () => {
      expect(service.getActionDescription(ACTION_TYPE.GET_VALUE)).toBe('Get value');
    });

    it('should return "Process" for unknown action type', () => {
      expect(service.getActionDescription('UNKNOWN')).toBe('Process');
    });
  });

  describe('formatDetailedProgressMessage', () => {
    it('should format detailed message for TYPE action', () => {
      const result = service.formatDetailedProgressMessage(3, 10, ACTION_TYPE.TYPE);
      expect(result).toBe('Type (Step 3/10)');
    });

    it('should format detailed message for CLICK action', () => {
      const result = service.formatDetailedProgressMessage(5, 20, ACTION_TYPE.CLICK);
      expect(result).toBe('Click (Step 5/20)');
    });

    it('should format detailed message for CHANGE_URL action', () => {
      const result = service.formatDetailedProgressMessage(2, 5, ACTION_TYPE.CHANGE_URL);
      expect(result).toBe('Navigate (Step 2/5)');
    });

    it('should format detailed message for SELECT_VALUE action', () => {
      const result = service.formatDetailedProgressMessage(7, 15, ACTION_TYPE.SELECT_VALUE);
      expect(result).toBe('Select (Step 7/15)');
    });

    it('should format detailed message for JUDGE action', () => {
      const result = service.formatDetailedProgressMessage(4, 8, ACTION_TYPE.JUDGE);
      expect(result).toBe('Validate (Step 4/8)');
    });

    it('should format detailed message for unknown action', () => {
      const result = service.formatDetailedProgressMessage(1, 1, 'UNKNOWN');
      expect(result).toBe('Process (Step 1/1)');
    });
  });

  describe('isValidProgress', () => {
    it('should return true for valid progress', () => {
      expect(service.isValidProgress(5, 10)).toBe(true);
    });

    it('should return true when current equals total', () => {
      expect(service.isValidProgress(10, 10)).toBe(true);
    });

    it('should return true when current is 0', () => {
      expect(service.isValidProgress(0, 10)).toBe(true);
    });

    it('should return false when current is negative', () => {
      expect(service.isValidProgress(-1, 10)).toBe(false);
    });

    it('should return false when total is zero', () => {
      expect(service.isValidProgress(5, 0)).toBe(false);
    });

    it('should return false when total is negative', () => {
      expect(service.isValidProgress(5, -10)).toBe(false);
    });

    it('should return false when current exceeds total', () => {
      expect(service.isValidProgress(11, 10)).toBe(false);
    });

    it('should return false when current is not a number', () => {
      expect(service.isValidProgress('5' as any, 10)).toBe(false);
    });

    it('should return false when total is not a number', () => {
      expect(service.isValidProgress(5, '10' as any)).toBe(false);
    });

    it('should return false when both are not numbers', () => {
      expect(service.isValidProgress('5' as any, '10' as any)).toBe(false);
    });
  });
});
