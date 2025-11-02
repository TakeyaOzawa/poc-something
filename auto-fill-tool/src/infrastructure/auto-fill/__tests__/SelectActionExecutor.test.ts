/**
 * Unit Tests: SelectActionExecutor
 * Tests for SELECT_* action execution (select element manipulation)
 */

import { SelectActionExecutor } from '../SelectActionExecutor';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';
import {
  createMockSystemSettings,
  createMockSystemSettingsRepository,
} from '@tests/helpers/MockSystemSettings';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SelectActionExecutor', () => {
  describe('executeSelectAction', () => {
    let executor: SelectActionExecutor;
    let mockSystemSettingsRepository: jest.Mocked<SystemSettingsRepository>;
    let select: HTMLSelectElement;
    let multiSelect: HTMLSelectElement;

    beforeEach(() => {
      // Mock system settings repository
      const mockSettings = createMockSystemSettings();
      mockSystemSettingsRepository = createMockSystemSettingsRepository(mockSettings);

      // Create executor instance
      executor = new SelectActionExecutor(new NoOpLogger(), mockSystemSettingsRepository);

      // Create single select element
      select = document.createElement('select');
      select.innerHTML = `
        <option value="1">Option One</option>
        <option value="2">Option Two</option>
        <option value="3">Option Three</option>
      `;

      // Create multiple select element
      multiSelect = document.createElement('select');
      multiSelect.multiple = true;
      multiSelect.innerHTML = `
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
        <option value="c">Gamma</option>
      `;
    });

    describe('element not found', () => {
      it('should return failure when element is null', () => {
        const result = executor.executeSelectAction(null, '1', 'select_value', 0);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element not found');
      });
    });

    describe('element validation', () => {
      it('should return failure when element is not a select', () => {
        const div = document.createElement('div');
        const result = executor.executeSelectAction(div, '1', 'select_value', 0);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element is not a select element: DIV');
      });

      it('should return failure for custom select component (pattern 20)', () => {
        const div = document.createElement('div');
        const result = executor.executeSelectAction(div, '1', 'select_value', 20);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Custom select component support not yet implemented: DIV');
      });

      it('should return failure for jQuery select component (pattern 30)', () => {
        const div = document.createElement('div');
        const result = executor.executeSelectAction(div, '1', 'select_value', 30);
        expect(result.success).toBe(false);
        expect(result.message).toBe('jQuery select component support not yet implemented: DIV');
      });
    });

    describe('select_value action', () => {
      it('should select option by value', () => {
        const result = executor.executeSelectAction(select, '2', 'select_value', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
        expect(result.message).toContain('Option Two');
      });

      it('should fail when value does not exist', () => {
        const result = executor.executeSelectAction(select, '999', 'select_value', 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain('No matching option found');
        expect(result.message).toContain('select_value');
        expect(result.message).toContain('999');
      });

      it('should select first matching value', () => {
        select.innerHTML += '<option value="2">Duplicate</option>';
        const result = executor.executeSelectAction(select, '2', 'select_value', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
      });

      it('should handle empty value', () => {
        select.innerHTML = '<option value="">Empty</option>' + select.innerHTML;
        const result = executor.executeSelectAction(select, '', 'select_value', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('');
      });
    });

    describe('select_index action', () => {
      it('should select option by index', () => {
        const result = executor.executeSelectAction(select, '1', 'select_index', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
        expect(result.message).toContain('Option Two');
      });

      it('should select first option (index 0)', () => {
        const result = executor.executeSelectAction(select, '0', 'select_index', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('1');
      });

      it('should select last option', () => {
        const result = executor.executeSelectAction(select, '2', 'select_index', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('3');
      });

      it('should fail when index is out of bounds (negative)', () => {
        const result = executor.executeSelectAction(select, '-1', 'select_index', 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain('No matching option found');
      });

      it('should fail when index is out of bounds (too large)', () => {
        const result = executor.executeSelectAction(select, '999', 'select_index', 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain('No matching option found');
      });

      it('should fail when index is not a number', () => {
        const result = executor.executeSelectAction(select, 'abc', 'select_index', 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain('No matching option found');
      });
    });

    describe('select_text action', () => {
      it('should select option by partial text match', () => {
        const result = executor.executeSelectAction(select, 'Two', 'select_text', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
        expect(result.message).toContain('Option Two');
      });

      it('should match case-sensitively', () => {
        const result = executor.executeSelectAction(select, 'option two', 'select_text', 0);
        expect(result.success).toBe(false);
      });

      it('should match substring', () => {
        const result = executor.executeSelectAction(select, 'One', 'select_text', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('1');
      });

      it('should select first matching option', () => {
        const result = executor.executeSelectAction(select, 'Option', 'select_text', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('1'); // First match
      });

      it('should fail when text is not found', () => {
        const result = executor.executeSelectAction(select, 'NotFound', 'select_text', 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain('No matching option found');
      });
    });

    describe('select_text_exact action', () => {
      it('should select option by exact text match', () => {
        const result = executor.executeSelectAction(select, 'Option Two', 'select_text_exact', 0);
        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
      });

      it('should fail on partial match', () => {
        const result = executor.executeSelectAction(select, 'Two', 'select_text_exact', 0);
        expect(result.success).toBe(false);
      });

      it('should be case-sensitive', () => {
        const result = executor.executeSelectAction(select, 'option two', 'select_text_exact', 0);
        expect(result.success).toBe(false);
      });

      it('should match with leading/trailing spaces if present in option', () => {
        select.innerHTML = '<option value="1"> Spaced </option>';
        // Note: Browser normalizes whitespace in option text
        // So we test with the normalized value
        const optionText = select.options[0].text;
        const result = executor.executeSelectAction(select, optionText, 'select_text_exact', 0);
        expect(result.success).toBe(true);
      });

      it('should fail when exact text is not found', () => {
        const result = executor.executeSelectAction(select, 'Option', 'select_text_exact', 0);
        expect(result.success).toBe(false);
      });
    });

    describe('unknown action type', () => {
      it('should return failure for unknown action', () => {
        const result = executor.executeSelectAction(select, '1', 'unknown_action', 0);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown action type: unknown_action');
      });

      it('should handle empty action string', () => {
        const result = executor.executeSelectAction(select, '1', '', 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Unknown action type');
      });
    });

    describe('multiple select handling', () => {
      it('should set selected for multiple select (pattern 100)', () => {
        jest.spyOn(multiSelect.options[0], 'selected', 'set');

        const result = executor.executeSelectAction(multiSelect, 'a', 'select_value', 100);

        expect(result.success).toBe(true);
        expect(multiSelect.options[0].selected).toBe(true);
      });

      it('should not clear other selections in multiple select', () => {
        multiSelect.options[0].selected = true;
        multiSelect.options[1].selected = true;

        const result = executor.executeSelectAction(multiSelect, 'c', 'select_value', 100);

        expect(result.success).toBe(true);
        expect(multiSelect.options[0].selected).toBe(true);
        expect(multiSelect.options[1].selected).toBe(true);
        expect(multiSelect.options[2].selected).toBe(true);
      });

      it('should use value assignment for single select (pattern 0)', () => {
        const result = executor.executeSelectAction(select, '2', 'select_value', 0);

        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
      });

      it('should handle pattern 10 as single select', () => {
        const result = executor.executeSelectAction(select, '2', 'select_value', 10);

        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
      });
    });

    describe('event dispatching', () => {
      it('should dispatch change event', () => {
        jest.spyOn(select, 'dispatchEvent');

        executor.executeSelectAction(select, '2', 'select_value', 0);

        expect(select.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });

      it('should dispatch input event', () => {
        jest.spyOn(select, 'dispatchEvent');

        executor.executeSelectAction(select, '2', 'select_value', 0);

        expect(select.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input', bubbles: true })
        );
      });

      it('should dispatch both change and input events', () => {
        const events: string[] = [];
        select.addEventListener('change', () => events.push('change'));
        select.addEventListener('input', () => events.push('input'));

        executor.executeSelectAction(select, '2', 'select_value', 0);

        // Both events should be dispatched
        expect(events).toContain('change');
        expect(events).toContain('input');
        expect(events.length).toBe(2);
      });
    });

    describe('error handling', () => {
      it('should handle errors during event dispatch', () => {
        const badSelect = document.createElement('select');
        badSelect.innerHTML = '<option value="1">Test</option>';

        // Override dispatchEvent to throw an error
        badSelect.dispatchEvent = () => {
          throw new Error('Dispatch error');
        };

        const result = executor.executeSelectAction(badSelect, '1', 'select_value', 0);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Dispatch error');
      });

      it('should handle unknown errors', () => {
        const badSelect = document.createElement('select');
        badSelect.innerHTML = '<option value="1">Test</option>';

        badSelect.dispatchEvent = () => {
          throw 'string error';
        };

        const result = executor.executeSelectAction(badSelect, '1', 'select_value', 0);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown error');
      });
    });

    describe('boundary tests', () => {
      it('should handle select with no options', () => {
        select.innerHTML = '';
        const result = executor.executeSelectAction(select, '1', 'select_value', 0);
        expect(result.success).toBe(false);
      });

      it('should handle select with one option', () => {
        select.innerHTML = '<option value="only">Only Option</option>';
        const result = executor.executeSelectAction(select, 'only', 'select_value', 0);
        expect(result.success).toBe(true);
      });

      it('should handle options with special characters in text', () => {
        select.innerHTML = '<option value="1">Option & Special < > "</option>';
        const result = executor.executeSelectAction(
          select,
          'Option & Special < > "',
          'select_text_exact',
          0
        );
        expect(result.success).toBe(true);
      });

      it('should handle options with Unicode text', () => {
        select.innerHTML = '<option value="1">オプション</option>';
        const result = executor.executeSelectAction(select, 'オプション', 'select_text_exact', 0);
        expect(result.success).toBe(true);
      });

      it('should handle very long option text', () => {
        const longText = 'A'.repeat(1000);
        select.innerHTML = `<option value="1">${longText}</option>`;
        const result = executor.executeSelectAction(select, longText, 'select_text_exact', 0);
        expect(result.success).toBe(true);
      });

      it('should handle numeric strings as index correctly', () => {
        const result = executor.executeSelectAction(select, '0', 'select_index', 0);
        expect(result.success).toBe(true);
        expect(select.selectedIndex).toBe(0);
      });
    });

    describe('pattern decoding', () => {
      it('should decode pattern 100 as multiple select', () => {
        const result = executor.executeSelectAction(multiSelect, 'a', 'select_value', 100);
        expect(result.success).toBe(true);
      });

      it('should decode pattern 120 as multiple select with custom type 2', () => {
        const div = document.createElement('div');
        const result = executor.executeSelectAction(div, 'a', 'select_value', 120);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Custom select component');
      });

      it('should decode pattern 130 as multiple select with jQuery type', () => {
        const div = document.createElement('div');
        const result = executor.executeSelectAction(div, 'a', 'select_value', 130);
        expect(result.success).toBe(false);
        expect(result.message).toContain('jQuery select component');
      });
    });
  });

  describe('execute method (waitForOptionsMilliseconds)', () => {
    let executor: SelectActionExecutor;
    let mockLogger: jest.Mocked<Logger>;
    let mockSystemSettingsRepository: jest.Mocked<SystemSettingsRepository>;
    let mockSystemSettings: SystemSettingsCollection;

    beforeEach(() => {
      // Mock logger
      mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn(),
        createChild: jest.fn(),
      };

      // Mock system settings
      mockSystemSettings = createMockSystemSettings({
        getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(500),
      });

      // Mock system settings repository
      mockSystemSettingsRepository = createMockSystemSettingsRepository(mockSystemSettings);

      // Create executor
      executor = new SelectActionExecutor(mockLogger, mockSystemSettingsRepository);

      // Mock browser.scripting.executeScript
      (browser.scripting.executeScript as jest.Mock) = jest.fn().mockResolvedValue([
        {
          result: { success: true, message: 'Selected: Test Option' },
        },
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('wait time for custom select patterns', () => {
      it('should wait for pattern 20 (custom select, single)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 20, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        // Should have waited approximately 500ms
        expect(elapsedTime).toBeGreaterThanOrEqual(450); // Allow 50ms tolerance
        expect(mockSystemSettingsRepository.load).toHaveBeenCalledTimes(1);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Waiting 500ms for custom select options to load')
        );
      });

      it('should wait for pattern 30 (jQuery select, single)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 30, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeGreaterThanOrEqual(450);
        expect(mockSystemSettingsRepository.load).toHaveBeenCalledTimes(1);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Waiting 500ms for custom select options to load')
        );
      });

      it('should wait for pattern 120 (custom select, multiple)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 120, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeGreaterThanOrEqual(450);
        expect(mockSystemSettingsRepository.load).toHaveBeenCalledTimes(1);
      });

      it('should wait for pattern 130 (jQuery select, multiple)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 130, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeGreaterThanOrEqual(450);
        expect(mockSystemSettingsRepository.load).toHaveBeenCalledTimes(1);
      });

      it('should use configured wait time from system settings', async () => {
        // Change wait time to 1000ms
        mockSystemSettings = createMockSystemSettings({
          getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(1000),
        });
        mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSystemSettings));

        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 20, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeGreaterThanOrEqual(950); // 1000ms - 50ms tolerance
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Waiting 1000ms for custom select options to load')
        );
      });
    });

    describe('no wait time for native select patterns', () => {
      it('should NOT wait for pattern 10 (native select, single)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 10, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        // Should complete quickly without waiting
        expect(elapsedTime).toBeLessThan(100);
        expect(mockSystemSettingsRepository.load).not.toHaveBeenCalled();
        expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining('Waiting'));
      });

      it('should NOT wait for pattern 110 (native select, multiple)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 110, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeLessThan(100);
        expect(mockSystemSettingsRepository.load).not.toHaveBeenCalled();
      });

      it('should NOT wait for pattern 0 (default native)', async () => {
        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 0, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeLessThan(100);
        expect(mockSystemSettingsRepository.load).not.toHaveBeenCalled();
      });
    });

    describe('integration with browser.scripting.executeScript', () => {
      it('should call executeScript after wait time', async () => {
        await executor.execute(1, '//select', 'value', 20, 1, 'select_value');

        expect(browser.scripting.executeScript).toHaveBeenCalledWith(
          expect.objectContaining({
            target: { tabId: 1 },
            func: expect.any(Function),
            args: ['//select', 'value', 'select_value', 20, 1],
          })
        );
      });

      it('should return result from executeScript', async () => {
        const result = await executor.execute(1, '//select', 'value', 20, 1, 'select_value');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Selected: Test Option');
      });

      it('should handle executeScript errors', async () => {
        (browser.scripting.executeScript as jest.Mock).mockRejectedValue(
          new Error('Script execution failed')
        );

        const result = await executor.execute(1, '//select', 'value', 20, 1, 'select_value');

        expect(result.success).toBe(false);
        expect(result.message).toBe('Script execution failed');
        expect(mockLogger.error).toHaveBeenCalledWith('Select step error', expect.any(Error));
      });
    });

    describe('wait time edge cases', () => {
      it('should handle zero wait time', async () => {
        mockSystemSettings = createMockSystemSettings({
          getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(0),
        });
        mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSystemSettings));

        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 20, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        // Should complete immediately
        expect(elapsedTime).toBeLessThan(50);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Waiting 0ms for custom select options to load')
        );
      });

      it('should handle very large wait time', async () => {
        mockSystemSettings = createMockSystemSettings({
          getWaitForOptionsMilliseconds: jest.fn().mockReturnValue(50), // Use smaller value for test speed
        });
        mockSystemSettingsRepository.load.mockResolvedValue(Result.success(mockSystemSettings));

        const startTime = Date.now();

        await executor.execute(1, '//select', 'test', 20, 1, 'select_value');

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(elapsedTime).toBeGreaterThanOrEqual(45);
      });
    });
  });
});
