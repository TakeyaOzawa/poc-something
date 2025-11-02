/**
 * Unit Tests: GetValueActionExecutor
 */

import browser from 'webextension-polyfill';
import { GetValueActionExecutor, GET_VALUE_PATTERN } from '../GetValueActionExecutor';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

jest.mock('webextension-polyfill');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetValueActionExecutor', () => {
  let executor: GetValueActionExecutor;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    executor = new GetValueActionExecutor(mockLogger);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET_VALUE_PATTERN', () => {
    it('should define all value retrieval patterns', () => {
      expect(GET_VALUE_PATTERN.VALUE).toBe(10);
      expect(GET_VALUE_PATTERN.TEXT_CONTENT).toBe(20);
      expect(GET_VALUE_PATTERN.INNER_TEXT).toBe(30);
      expect(GET_VALUE_PATTERN.INNER_HTML).toBe(40);
      expect(GET_VALUE_PATTERN.DATA_ATTRIBUTE).toBe(50);
    });
  });

  describe('execute', () => {
    const defaultParams = {
      tabId: 123,
      xpath: '//input[@id="username"]',
      value: 'testVar',
      actionPattern: GET_VALUE_PATTERN.VALUE,
      stepNumber: 1,
    };

    describe('Parameter validation', () => {
      it('should fail when variable name is empty', async () => {
        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          '',
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Variable name cannot be empty');
      });

      it('should fail when variable name is only whitespace', async () => {
        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          '   ',
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Variable name cannot be empty');
      });

      it('should trim variable name', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test value',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          '  testVar  ',
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.variableName).toBe('testVar');
      });
    });

    describe('Successful value retrieval', () => {
      it('should retrieve value successfully with pattern 10 (VALUE)', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test value',
              logs: ['Log 1', 'Log 2'],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          GET_VALUE_PATTERN.VALUE,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.retrievedValue).toBe('test value');
        expect(result.variableName).toBe('testVar');
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Getting value from element'),
          expect.any(Object)
        );
        expect(mockLogger.debug).toHaveBeenCalledWith('Log 1');
        expect(mockLogger.debug).toHaveBeenCalledWith('Log 2');
      });

      it('should retrieve value with pattern 20 (TEXT_CONTENT)', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'text content value',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          GET_VALUE_PATTERN.TEXT_CONTENT,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.retrievedValue).toBe('text content value');
        expect(browser.scripting.executeScript).toHaveBeenCalledWith(
          expect.objectContaining({
            target: { tabId: 123 },
            args: [defaultParams.xpath, GET_VALUE_PATTERN.TEXT_CONTENT, 1],
          })
        );
      });

      it('should retrieve value with pattern 30 (INNER_TEXT)', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'inner text value',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          GET_VALUE_PATTERN.INNER_TEXT,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.retrievedValue).toBe('inner text value');
      });

      it('should retrieve value with pattern 40 (INNER_HTML)', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: '<div>HTML content</div>',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          GET_VALUE_PATTERN.INNER_HTML,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.retrievedValue).toBe('<div>HTML content</div>');
      });

      it('should retrieve value with pattern 50 (DATA_ATTRIBUTE)', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'data-value-123',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          GET_VALUE_PATTERN.DATA_ATTRIBUTE,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.retrievedValue).toBe('data-value-123');
      });

      it('should log value preview when value is retrieved', async () => {
        const longValue = 'a'.repeat(150);
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: longValue,
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Value retrieved successfully'),
          expect.objectContaining({
            variableName: 'testVar',
            valueLength: 150,
            valuePreview: longValue.substring(0, 100),
          })
        );
      });

      it('should handle value with length exactly 100 characters', async () => {
        const value = 'a'.repeat(100);
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: value,
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Value retrieved successfully'),
          expect.objectContaining({
            valueLength: 100,
            valuePreview: value,
          })
        );
      });
    });

    describe('Failed value retrieval', () => {
      it('should handle element not found', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: false,
              message: 'Element not found',
              logs: ['Element not found for XPath'],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Element not found');
        expect(mockLogger.debug).toHaveBeenCalledWith('Element not found for XPath');
      });

      it('should handle value retrieval failure', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: false,
              message: 'Could not retrieve value from element',
              logs: ['No value retrieved from element'],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Could not retrieve value from element');
      });

      it('should handle empty result from executeScript', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('No result returned from executeScript');
      });

      it('should handle null result from executeScript', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([{ result: null }]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('No result returned from executeScript');
      });

      it('should handle undefined result from executeScript', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([{}]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('No result returned from executeScript');
      });
    });

    describe('Error handling', () => {
      it('should handle executeScript throwing an error', async () => {
        const error = new Error('Script execution failed');
        (browser.scripting.executeScript as jest.Mock).mockRejectedValue(error);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Script execution failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('getValue step error'),
          error
        );
      });

      it('should handle non-Error exception', async () => {
        (browser.scripting.executeScript as jest.Mock).mockRejectedValue('String error');

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown error');
      });

      it('should log error with step number', async () => {
        const error = new Error('Test error');
        (browser.scripting.executeScript as jest.Mock).mockRejectedValue(error);

        await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          5 // Step number 5
        );

        expect(mockLogger.error).toHaveBeenCalledWith('[Step 5] getValue step error', error);
      });
    });

    describe('Logging', () => {
      it('should log initial info with all parameters', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test',
              logs: [],
            },
          },
        ]);

        await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(mockLogger.info).toHaveBeenCalledWith('[Step 1] Getting value from element', {
          tabId: 123,
          xpath: '//input[@id="username"]',
          variableName: 'testVar',
          pattern: 10,
        });
      });

      it('should log all page context logs as debug', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test',
              logs: ['Log message 1', 'Log message 2', 'Log message 3'],
            },
          },
        ]);

        await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(mockLogger.debug).toHaveBeenCalledTimes(3);
        expect(mockLogger.debug).toHaveBeenCalledWith('Log message 1');
        expect(mockLogger.debug).toHaveBeenCalledWith('Log message 2');
        expect(mockLogger.debug).toHaveBeenCalledWith('Log message 3');
      });

      it('should handle empty logs array', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test',
              logs: [],
            },
          },
        ]);

        await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        // Info logs should still be called, but no debug logs
        expect(mockLogger.info).toHaveBeenCalled();
        expect(mockLogger.debug).not.toHaveBeenCalled();
      });

      it('should handle missing logs property', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test',
            },
          },
        ]);

        await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(mockLogger.info).toHaveBeenCalled();
        expect(mockLogger.debug).not.toHaveBeenCalled();
      });
    });

    describe('Return value structure', () => {
      it('should include variableName in successful result', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue: 'test value',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          'myVariable',
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.variableName).toBe('myVariable');
        expect(result.retrievedValue).toBe('test value');
        expect(result.success).toBe(true);
      });

      it('should not include variableName in failed result', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: false,
              message: 'Element not found',
              logs: [],
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.variableName).toBeUndefined();
        expect(result.retrievedValue).toBeUndefined();
        expect(result.success).toBe(false);
      });

      it('should preserve all properties from executeScript result', async () => {
        (browser.scripting.executeScript as jest.Mock).mockResolvedValue([
          {
            result: {
              success: true,
              message: 'Custom message',
              retrievedValue: 'test',
              logs: ['log1'],
              customProperty: 'custom value',
            },
          },
        ]);

        const result = await executor.execute(
          defaultParams.tabId,
          defaultParams.xpath,
          defaultParams.value,
          defaultParams.actionPattern,
          defaultParams.stepNumber
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Custom message');
        expect(result.retrievedValue).toBe('test');
        expect((result as any).customProperty).toBe('custom value');
      });
    });
  });
});
