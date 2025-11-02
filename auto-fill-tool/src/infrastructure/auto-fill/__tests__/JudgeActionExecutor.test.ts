/**
 * Unit Tests: JudgeActionExecutor
 * Tests for JUDGE action execution (value comparison/verification)
 */

import { JudgeActionExecutor } from '../JudgeActionExecutor';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('JudgeActionExecutor', () => {
  describe('executeJudgeAction', () => {
    let executor: JudgeActionExecutor;
    let input: HTMLInputElement;
    let textarea: HTMLTextAreaElement;
    let select: HTMLSelectElement;
    let div: HTMLDivElement;

    beforeEach(() => {
      // Create executor instance
      executor = new JudgeActionExecutor(new NoOpLogger());

      // Create test elements
      input = document.createElement('input');
      input.type = 'text';

      textarea = document.createElement('textarea');

      select = document.createElement('select');
      select.innerHTML = '<option value="1">Option 1</option><option value="2">Option 2</option>';

      div = document.createElement('div');
    });

    describe('element not found', () => {
      it('should return failure when element is null', () => {
        const result = executor.executeJudgeAction(null, 'test', 10);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element not found');
      });
    });

    describe('value extraction', () => {
      it('should extract value from text input', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'hello', 10);
        expect(result.success).toBe(true);
      });

      it('should extract value from textarea', () => {
        textarea.value = 'textarea content';
        const result = executor.executeJudgeAction(textarea, 'textarea content', 10);
        expect(result.success).toBe(true);
      });

      it('should extract value from select', () => {
        select.value = '1';
        const result = executor.executeJudgeAction(select, '1', 10);
        expect(result.success).toBe(true);
      });

      it('should extract textContent from other elements', () => {
        div.textContent = '  some text  ';
        const result = executor.executeJudgeAction(div, 'some text', 10);
        expect(result.success).toBe(true);
      });

      it('should handle checkbox checked state as "1"', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        const result = executor.executeJudgeAction(checkbox, '1', 10);
        expect(result.success).toBe(true);
      });

      it('should handle checkbox unchecked state as "0"', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        const result = executor.executeJudgeAction(checkbox, '0', 10);
        expect(result.success).toBe(true);
      });

      it('should handle radio checked state', () => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.checked = true;
        const result = executor.executeJudgeAction(radio, '1', 10);
        expect(result.success).toBe(true);
      });

      it('should handle empty textContent', () => {
        div.textContent = '';
        const result = executor.executeJudgeAction(div, '', 10);
        expect(result.success).toBe(true);
      });
    });

    describe('pattern 10 - equals comparison', () => {
      it('should match exact string', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'hello', 10);
        expect(result.success).toBe(true);
        expect(result.message).toContain('Judge passed');
      });

      it('should fail on non-matching string', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'world', 10);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Judge failed');
      });

      it('should match with regex pattern', () => {
        input.value = 'hello123';
        const result = executor.executeJudgeAction(input, 'hello\\d+', 10);
        expect(result.success).toBe(true);
      });

      it('should fail regex pattern that does not match', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, '\\d+', 10);
        expect(result.success).toBe(false);
      });

      it('should use exact match when regex is invalid', () => {
        input.value = 'hello[';
        const result = executor.executeJudgeAction(input, 'hello[', 10);
        expect(result.success).toBe(true);
      });

      it('should be case sensitive for exact match', () => {
        input.value = 'Hello';
        const result = executor.executeJudgeAction(input, 'hello', 10);
        expect(result.success).toBe(false);
      });
    });

    describe('pattern 20 - not equals comparison', () => {
      it('should pass when values are different', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'world', 20);
        expect(result.success).toBe(true);
        expect(result.message).toContain('Judge passed');
      });

      it('should fail when values are same', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'hello', 20);
        expect(result.success).toBe(false); // Should fail because values are equal
        expect(result.message).toContain('Judge failed');
      });

      it('should pass when regex does not match', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, '\\d+', 20);
        expect(result.success).toBe(true);
      });

      it('should use exact comparison for invalid regex', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'world', 20);
        expect(result.success).toBe(true);
      });
    });

    describe('pattern 30 - greater than comparison', () => {
      it('should compare numbers correctly', () => {
        input.value = '100';
        const result = executor.executeJudgeAction(input, '50', 30);
        expect(result.success).toBe(true);
        expect(result.message).toContain('Judge passed');
      });

      it('should fail when actual is less than expected', () => {
        input.value = '50';
        const result = executor.executeJudgeAction(input, '100', 30);
        expect(result.success).toBe(false);
      });

      it('should fail when numbers are equal', () => {
        input.value = '100';
        const result = executor.executeJudgeAction(input, '100', 30);
        expect(result.success).toBe(false);
      });

      it('should compare floating point numbers', () => {
        input.value = '10.5';
        const result = executor.executeJudgeAction(input, '10.2', 30);
        expect(result.success).toBe(true);
      });

      it('should compare negative numbers', () => {
        input.value = '-5';
        const result = executor.executeJudgeAction(input, '-10', 30);
        expect(result.success).toBe(true);
      });

      it('should fallback to string comparison for non-numeric values', () => {
        input.value = 'zebra';
        const result = executor.executeJudgeAction(input, 'apple', 30);
        expect(result.success).toBe(true);
      });

      it('should handle NaN values', () => {
        input.value = 'abc';
        const result = executor.executeJudgeAction(input, 'def', 30);
        expect(result.success).toBe(false); // 'abc' is not > 'def'
      });
    });

    describe('pattern 40 - less than comparison', () => {
      it('should compare numbers correctly', () => {
        input.value = '50';
        const result = executor.executeJudgeAction(input, '100', 40);
        expect(result.success).toBe(true);
        expect(result.message).toContain('Judge passed');
      });

      it('should fail when actual is greater than expected', () => {
        input.value = '100';
        const result = executor.executeJudgeAction(input, '50', 40);
        expect(result.success).toBe(false);
      });

      it('should fail when numbers are equal', () => {
        input.value = '100';
        const result = executor.executeJudgeAction(input, '100', 40);
        expect(result.success).toBe(false);
      });

      it('should compare floating point numbers', () => {
        input.value = '10.2';
        const result = executor.executeJudgeAction(input, '10.5', 40);
        expect(result.success).toBe(true);
      });

      it('should compare negative numbers', () => {
        input.value = '-10';
        const result = executor.executeJudgeAction(input, '-5', 40);
        expect(result.success).toBe(true);
      });

      it('should fallback to string comparison for non-numeric values', () => {
        input.value = 'apple';
        const result = executor.executeJudgeAction(input, 'zebra', 40);
        expect(result.success).toBe(true);
      });

      it('should handle zero correctly', () => {
        input.value = '0';
        const result = executor.executeJudgeAction(input, '1', 40);
        expect(result.success).toBe(true);
      });
    });

    describe('unknown pattern', () => {
      it('should default to exact match for unknown pattern', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'hello', 999);
        expect(result.success).toBe(true);
      });

      it('should fail exact match for unknown pattern', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, 'world', 999);
        expect(result.success).toBe(false);
      });

      it('should handle pattern 0 as exact match', () => {
        input.value = 'test';
        const result = executor.executeJudgeAction(input, 'test', 0);
        expect(result.success).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle errors when element property throws', () => {
        // Create a mock element that throws when accessing textContent
        const badElement = document.createElement('div');
        Object.defineProperty(badElement, 'textContent', {
          get() {
            throw new Error('TextContent access error');
          },
        });

        const result = executor.executeJudgeAction(badElement, 'test', 10);

        expect(result.success).toBe(false);
        expect(result.message).toBe('TextContent access error');
      });

      it('should handle unknown errors', () => {
        const badElement = document.createElement('div');
        Object.defineProperty(badElement, 'textContent', {
          get() {
            throw 'string error';
          },
        });

        const result = executor.executeJudgeAction(badElement, 'test', 10);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown error');
      });
    });

    describe('boundary tests', () => {
      it('should handle empty string comparison', () => {
        input.value = '';
        const result = executor.executeJudgeAction(input, '', 10);
        expect(result.success).toBe(true);
      });

      it('should handle whitespace differences', () => {
        input.value = 'hello';
        const result = executor.executeJudgeAction(input, ' hello ', 10);
        expect(result.success).toBe(false);
      });

      it('should handle very large numbers', () => {
        input.value = '999999999999';
        const result = executor.executeJudgeAction(input, '1000000000000', 40);
        expect(result.success).toBe(true);
      });

      it('should handle very small numbers', () => {
        input.value = '0.0001';
        const result = executor.executeJudgeAction(input, '0.0002', 40);
        expect(result.success).toBe(true);
      });

      it('should handle special characters in regex', () => {
        input.value = 'test@example.com';
        const result = executor.executeJudgeAction(input, '\\w+@\\w+\\.\\w+', 10);
        expect(result.success).toBe(true);
      });

      it('should handle Unicode characters', () => {
        input.value = 'こんにちは';
        const result = executor.executeJudgeAction(input, 'こんにちは', 10);
        expect(result.success).toBe(true);
      });
    });

    describe('success and failure messages', () => {
      it('should include actual value in success message', () => {
        input.value = 'test';
        const result = executor.executeJudgeAction(input, 'test', 10);
        expect(result.message).toContain('test');
        expect(result.message).toContain('matches expected value');
      });

      it('should include both values in failure message', () => {
        input.value = 'actual';
        const result = executor.executeJudgeAction(input, 'expected', 10);
        expect(result.message).toContain('actual');
        expect(result.message).toContain('expected');
        expect(result.message).toContain('does not match');
      });
    });
  });
});
