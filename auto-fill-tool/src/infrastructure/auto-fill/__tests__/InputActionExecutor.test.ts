/**
 * Unit Tests: InputActionExecutor
 * Tests for TYPE action execution
 */

import { InputActionExecutor } from '../InputActionExecutor';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('InputActionExecutor', () => {
  describe('executeInputAction', () => {
    let executor: InputActionExecutor;
    let input: HTMLInputElement;
    let textarea: HTMLTextAreaElement;
    let select: HTMLSelectElement;

    beforeEach(() => {
      // Create executor instance
      executor = new InputActionExecutor(new NoOpLogger());

      // Create test elements
      input = document.createElement('input');
      textarea = document.createElement('textarea');
      select = document.createElement('select');
      select.innerHTML = '<option value="1">Option 1</option><option value="2">Option 2</option>';
    });

    describe('element not found', () => {
      it('should return failure when element is null', () => {
        const result = executor.executeInputAction(null, 'test', 10);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element not found');
      });
    });

    describe('pattern 0 - framework-agnostic input (same as pattern 20)', () => {
      it('should set value on text input with events', () => {
        input.type = 'text';
        jest.spyOn(input, 'dispatchEvent');

        const result = executor.executeInputAction(input, 'hello', 0);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Input successful');
        expect(input.value).toBe('hello');
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'input',
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        );
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'change',
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        );
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'blur', bubbles: true, cancelable: true, composed: true })
        );
      });

      it('should set value on textarea with events', () => {
        jest.spyOn(textarea, 'dispatchEvent');

        const result = executor.executeInputAction(textarea, 'hello world', 0);

        expect(result.success).toBe(true);
        expect(textarea.value).toBe('hello world');
        expect(textarea.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input' })
        );
        expect(textarea.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change' })
        );
        expect(textarea.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'blur' })
        );
      });

      it('should set value on select with events', () => {
        jest.spyOn(select, 'dispatchEvent');

        const result = executor.executeInputAction(select, '2', 0);

        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
        expect(select.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input' })
        );
        expect(select.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change' })
        );
        expect(select.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'blur' })
        );
      });

      it('should set value on React-like input using native setter', () => {
        input.type = 'text';
        (input as any)._valueTracker = {}; // Mark as React element

        const nativeSetter = jest.fn();
        jest.spyOn(Object, 'getOwnPropertyDescriptor').mockReturnValue({
          set: nativeSetter,
          enumerable: true,
          configurable: true,
        });

        const result = executor.executeInputAction(input, 'react-value', 0);

        expect(result.success).toBe(true);
        expect(nativeSetter).toHaveBeenCalledWith('react-value');
      });

      it('should trigger jQuery change if available', () => {
        const jQueryMock = jest.fn().mockReturnValue({
          length: 1,
          trigger: jest.fn(),
        });
        (window as any).jQuery = jQueryMock;

        const result = executor.executeInputAction(input, 'jquery-test', 0);

        expect(result.success).toBe(true);
        expect(jQueryMock).toHaveBeenCalledWith(input);
        expect(jQueryMock(input).trigger).toHaveBeenCalledWith('change');

        delete (window as any).jQuery;
      });
    });

    describe('pattern 10 - basic input', () => {
      it('should set value on text input', () => {
        input.type = 'text';
        jest.spyOn(input, 'focus');
        jest.spyOn(input, 'dispatchEvent');

        const result = executor.executeInputAction(input, 'hello', 10);

        expect(result.success).toBe(true);
        expect(input.focus).toHaveBeenCalled();
        expect(input.value).toBe('hello');
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input', bubbles: true })
        );
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });

      it('should check checkbox when value is "1"', () => {
        input.type = 'checkbox';
        jest.spyOn(input, 'dispatchEvent');

        const result = executor.executeInputAction(input, '1', 10);

        expect(result.success).toBe(true);
        expect(input.checked).toBe(true);
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });

      it('should uncheck checkbox when value is not "1"', () => {
        input.type = 'checkbox';
        input.checked = true;

        const result = executor.executeInputAction(input, '0', 10);

        expect(result.success).toBe(true);
        expect(input.checked).toBe(false);
      });

      it('should set radio button when value is "1"', () => {
        input.type = 'radio';

        const result = executor.executeInputAction(input, '1', 10);

        expect(result.success).toBe(true);
        expect(input.checked).toBe(true);
      });

      it('should set value on textarea', () => {
        jest.spyOn(textarea, 'focus');
        jest.spyOn(textarea, 'dispatchEvent');

        const result = executor.executeInputAction(textarea, 'hello world', 10);

        expect(result.success).toBe(true);
        expect(textarea.value).toBe('hello world');
        expect(textarea.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input', bubbles: true })
        );
        expect(textarea.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });

      it('should set value on select', () => {
        jest.spyOn(select, 'focus');
        jest.spyOn(select, 'dispatchEvent');

        const result = executor.executeInputAction(select, '2', 10);

        expect(result.success).toBe(true);
        expect(select.value).toBe('2');
        expect(select.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });
    });

    describe('pattern 20 - framework-agnostic input', () => {
      it('should set value on regular input', () => {
        input.type = 'text';
        jest.spyOn(input, 'dispatchEvent');

        const result = executor.executeInputAction(input, 'hello', 20);

        expect(result.success).toBe(true);
        expect(input.value).toBe('hello');
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'input',
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        );
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'change',
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        );
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'blur', bubbles: true, cancelable: true, composed: true })
        );
      });

      it('should set value on React-like input using native setter', () => {
        input.type = 'text';
        (input as any)._valueTracker = {}; // Mark as React element

        const nativeSetter = jest.fn();
        jest.spyOn(Object, 'getOwnPropertyDescriptor').mockReturnValue({
          set: nativeSetter,
          enumerable: true,
          configurable: true,
        });

        const result = executor.executeInputAction(input, 'react-value', 20);

        expect(result.success).toBe(true);
        expect(nativeSetter).toHaveBeenCalledWith('react-value');
      });

      it('should fallback to direct assignment for React input if no setter', () => {
        input.type = 'text';
        (input as any)._valueTracker = {}; // Mark as React element

        jest.spyOn(Object, 'getOwnPropertyDescriptor').mockReturnValue({
          set: undefined,
          enumerable: true,
          configurable: true,
        });

        const result = executor.executeInputAction(input, 'fallback', 20);

        expect(result.success).toBe(true);
        expect(input.value).toBe('fallback');
      });

      it('should set value on React-like textarea using native setter', () => {
        (textarea as any).__reactProps$ = {}; // Mark as React element

        const nativeSetter = jest.fn();
        jest.spyOn(Object, 'getOwnPropertyDescriptor').mockReturnValue({
          set: nativeSetter,
          enumerable: true,
          configurable: true,
        });

        const result = executor.executeInputAction(textarea, 'react-textarea', 20);

        expect(result.success).toBe(true);
        expect(nativeSetter).toHaveBeenCalledWith('react-textarea');
      });

      it('should set value on regular textarea', () => {
        jest.spyOn(textarea, 'dispatchEvent');

        const result = executor.executeInputAction(textarea, 'text-area-value', 20);

        expect(result.success).toBe(true);
        expect(textarea.value).toBe('text-area-value');
        expect(textarea.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input' })
        );
      });

      it('should set value on select element', () => {
        jest.spyOn(select, 'dispatchEvent');

        const result = executor.executeInputAction(select, '1', 20);

        expect(result.success).toBe(true);
        expect(select.value).toBe('1');
      });

      it('should trigger jQuery change if available', () => {
        const jQueryMock = jest.fn().mockReturnValue({
          length: 1,
          trigger: jest.fn(),
        });
        (window as any).jQuery = jQueryMock;

        const result = executor.executeInputAction(input, 'jquery-test', 20);

        expect(result.success).toBe(true);
        expect(jQueryMock).toHaveBeenCalledWith(input);
        expect(jQueryMock(input).trigger).toHaveBeenCalledWith('change');

        delete (window as any).jQuery;
      });

      it('should not trigger jQuery if not available', () => {
        delete (window as any).jQuery;

        const result = executor.executeInputAction(input, 'no-jquery', 20);

        expect(result.success).toBe(true);
      });
    });

    describe('unknown pattern', () => {
      it('should use pattern 20 behavior for unknown pattern', () => {
        jest.spyOn(input, 'dispatchEvent');

        const result = executor.executeInputAction(input, 'unknown-pattern', 999);

        expect(result.success).toBe(true);
        expect(input.value).toBe('unknown-pattern');
        expect(input.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'input', composed: true })
        );
      });
    });

    describe('error handling', () => {
      it('should handle errors gracefully', () => {
        const badElement = {
          dispatchEvent: () => {
            throw new Error('Dispatch error');
          },
        } as any;

        const result = executor.executeInputAction(badElement, 'error', 20);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Dispatch error');
      });

      it('should handle unknown errors', () => {
        const badElement = {
          dispatchEvent: () => {
            throw 'string error';
          },
        } as any;

        const result = executor.executeInputAction(badElement, 'error', 20);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown error');
      });
    });
  });
});
