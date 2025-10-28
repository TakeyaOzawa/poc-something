/**
 * Unit Tests: CheckboxActionExecutor
 * Tests for CHECK action execution (checkbox/radio buttons)
 */

import { CheckboxActionExecutor } from '../CheckboxActionExecutor';
import { NoOpLogger } from '@domain/services/NoOpLogger';

describe('CheckboxActionExecutor', () => {
  describe('executeCheckboxAction', () => {
    let executor: CheckboxActionExecutor;
    let checkbox: HTMLInputElement;
    let radio: HTMLInputElement;

    beforeEach(() => {
      // Create executor instance with NoOpLogger
      executor = new CheckboxActionExecutor(new NoOpLogger());

      // Create test elements
      checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      radio = document.createElement('input');
      radio.type = 'radio';
    });

    describe('element not found', () => {
      it('should return failure when element is null', () => {
        const result = executor.executeCheckboxAction(null, '1', 10);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element not found');
      });
    });

    describe('element validation', () => {
      it('should return failure when element is not an input', () => {
        const div = document.createElement('div');
        const result = executor.executeCheckboxAction(div, '1', 10);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element is not an input element: DIV');
      });

      it('should return failure when input is not checkbox/radio', () => {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        const result = executor.executeCheckboxAction(textInput, '1', 10);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element is not a checkbox/radio: text');
      });
    });

    describe('value parsing', () => {
      it('should check checkbox when value is "1"', () => {
        checkbox.checked = false;
        const result = executor.executeCheckboxAction(checkbox, '1', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(true);
      });

      it('should check checkbox when value is "true"', () => {
        checkbox.checked = false;
        const result = executor.executeCheckboxAction(checkbox, 'true', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(true);
      });

      it('should check checkbox when value is "TRUE"', () => {
        checkbox.checked = false;
        const result = executor.executeCheckboxAction(checkbox, 'TRUE', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(true);
      });

      it('should uncheck checkbox when value is "0"', () => {
        checkbox.checked = true;
        const result = executor.executeCheckboxAction(checkbox, '0', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(false);
      });

      it('should uncheck checkbox when value is "false"', () => {
        checkbox.checked = true;
        const result = executor.executeCheckboxAction(checkbox, 'false', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(false);
      });

      it('should uncheck checkbox for any non-truthy value', () => {
        checkbox.checked = true;
        const result = executor.executeCheckboxAction(checkbox, 'anything', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(false);
      });
    });

    describe('pattern 10 - basic checkbox', () => {
      it('should check checkbox and dispatch change event', () => {
        jest.spyOn(checkbox, 'dispatchEvent');

        const result = executor.executeCheckboxAction(checkbox, '1', 10);

        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(true);
        expect(checkbox.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });

      it('should check radio button and dispatch change event', () => {
        jest.spyOn(radio, 'dispatchEvent');

        const result = executor.executeCheckboxAction(radio, '1', 10);

        expect(result.success).toBe(true);
        expect(radio.checked).toBe(true);
        expect(radio.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'change', bubbles: true })
        );
      });

      it('should uncheck checkbox', () => {
        checkbox.checked = true;
        const result = executor.executeCheckboxAction(checkbox, '0', 10);

        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(false);
      });
    });

    describe('pattern 20 - framework-agnostic checkbox', () => {
      it('should check checkbox with multiple events', () => {
        const events: any[] = [];
        jest.spyOn(checkbox, 'dispatchEvent').mockImplementation((event) => {
          events.push(event);
          return true;
        });

        const result = executor.executeCheckboxAction(checkbox, '1', 20);

        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(true);

        // Verify all three event types were dispatched
        const clickEvent = events.find((e) => e.type === 'click');
        const inputEvent = events.find((e) => e.type === 'input');
        const changeEvent = events.find((e) => e.type === 'change');

        expect(clickEvent).toBeDefined();
        expect(inputEvent).toBeDefined();
        expect(changeEvent).toBeDefined();
      });

      it('should uncheck checkbox with multiple events', () => {
        checkbox.checked = true;
        const events: any[] = [];
        jest.spyOn(checkbox, 'dispatchEvent').mockImplementation((event) => {
          events.push(event);
          return true;
        });

        const result = executor.executeCheckboxAction(checkbox, '0', 20);

        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(false);
        // Verify all three event types were dispatched
        expect(events.length).toBe(3); // click, input, change
      });

      it('should trigger jQuery change if available', () => {
        const jQueryMock = jest.fn().mockReturnValue({
          length: 1,
          trigger: jest.fn(),
        });
        (window as any).jQuery = jQueryMock;

        const result = executor.executeCheckboxAction(checkbox, '1', 20);

        expect(result.success).toBe(true);
        expect(jQueryMock).toHaveBeenCalledWith(checkbox);
        expect(jQueryMock(checkbox).trigger).toHaveBeenCalledWith('change');

        delete (window as any).jQuery;
      });

      it('should not trigger jQuery if not available', () => {
        delete (window as any).jQuery;

        const result = executor.executeCheckboxAction(checkbox, '1', 20);

        expect(result.success).toBe(true);
      });

      it('should work with radio button', () => {
        jest.spyOn(radio, 'dispatchEvent');

        const result = executor.executeCheckboxAction(radio, '1', 20);

        expect(result.success).toBe(true);
        expect(radio.checked).toBe(true);
        expect(radio.dispatchEvent).toHaveBeenCalledTimes(3);
      });
    });

    describe('unknown pattern', () => {
      it('should use pattern 20 behavior for unknown pattern', () => {
        const events: any[] = [];
        jest.spyOn(checkbox, 'dispatchEvent').mockImplementation((event) => {
          events.push(event);
          return true;
        });

        const result = executor.executeCheckboxAction(checkbox, '1', 999);

        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(true);

        // Verify all three event types were dispatched
        const clickEvent = events.find((e) => e.type === 'click');
        const inputEvent = events.find((e) => e.type === 'input');
        const changeEvent = events.find((e) => e.type === 'change');

        expect(clickEvent).toBeDefined();
        expect(inputEvent).toBeDefined();
        expect(changeEvent).toBeDefined();
      });

      it('should default to pattern 20 when pattern is 0', () => {
        const events: any[] = [];
        jest.spyOn(checkbox, 'dispatchEvent').mockImplementation((event) => {
          events.push(event);
          return true;
        });

        const result = executor.executeCheckboxAction(checkbox, '1', 0);

        expect(result.success).toBe(true);

        // Verify events were dispatched (pattern 20 behavior)
        const hasClick = events.some((e) => e.type === 'click');
        expect(hasClick).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle errors gracefully', () => {
        const badCheckbox = document.createElement('input');
        badCheckbox.type = 'checkbox';

        // Override dispatchEvent to throw an error
        badCheckbox.dispatchEvent = () => {
          throw new Error('Dispatch error');
        };

        const result = executor.executeCheckboxAction(badCheckbox, '1', 10);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Dispatch error');
      });

      it('should handle unknown errors', () => {
        const badCheckbox = document.createElement('input');
        badCheckbox.type = 'checkbox';

        badCheckbox.dispatchEvent = () => {
          throw 'string error';
        };

        const result = executor.executeCheckboxAction(badCheckbox, '1', 10);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown error');
      });
    });

    describe('success messages', () => {
      it('should return success message with checked state', () => {
        const result = executor.executeCheckboxAction(checkbox, '1', 10);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Checkbox set to true');
      });

      it('should return success message with unchecked state', () => {
        checkbox.checked = true;
        const result = executor.executeCheckboxAction(checkbox, '0', 10);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Checkbox set to false');
      });
    });

    describe('boundary tests', () => {
      it('should handle empty string as uncheck', () => {
        checkbox.checked = true;
        const result = executor.executeCheckboxAction(checkbox, '', 10);
        expect(result.success).toBe(true);
        expect(checkbox.checked).toBe(false);
      });

      it('should handle various truthy strings', () => {
        const truthyValues = ['1', 'true', 'TRUE', 'True', 'TrUe'];
        truthyValues.forEach((value) => {
          checkbox.checked = false;
          const result = executor.executeCheckboxAction(checkbox, value, 10);
          expect(result.success).toBe(true);
          expect(checkbox.checked).toBe(true);
        });
      });

      it('should handle various falsy values', () => {
        const falsyValues = ['0', 'false', 'FALSE', '', 'no', 'off'];
        falsyValues.forEach((value) => {
          checkbox.checked = true;
          const result = executor.executeCheckboxAction(checkbox, value, 10);
          expect(result.success).toBe(true);
          expect(checkbox.checked).toBe(false);
        });
      });
    });
  });
});
