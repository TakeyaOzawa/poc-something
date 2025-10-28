/**
 * Unit Tests: ClickActionExecutor
 * Tests for CLICK action execution
 */

import { ClickActionExecutor } from '../ClickActionExecutor';
import { NoOpLogger } from '@domain/services/NoOpLogger';

describe('ClickActionExecutor', () => {
  describe('executeClickAction', () => {
    let executor: ClickActionExecutor;
    let button: HTMLButtonElement;

    beforeEach(() => {
      executor = new ClickActionExecutor(new NoOpLogger());

      button = document.createElement('button');

      // Mock PointerEvent if not available (jsdom doesn't support it)
      if (typeof PointerEvent === 'undefined') {
        (global as any).PointerEvent = class extends MouseEvent {
          constructor(type: string, params?: any) {
            super(type, params);
          }
        };
      }
    });

    describe('element not found', () => {
      it('should return failure when element is null', () => {
        const result = executor.executeClickAction(null, 10);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Element not found');
      });
    });

    describe('pattern 10 - basic click', () => {
      it('should call click method', () => {
        jest.spyOn(button, 'click');

        const result = executor.executeClickAction(button, 10);

        expect(result.success).toBe(true);
        expect(button.click).toHaveBeenCalled();
      });
    });

    describe('pattern 20 - framework-agnostic click', () => {
      it('should dispatch pointer and mouse events', () => {
        jest.spyOn(button, 'dispatchEvent');
        jest.spyOn(button, 'click');

        const result = executor.executeClickAction(button, 20);

        expect(result.success).toBe(true);
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'pointerdown' })
        );
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'mousedown' })
        );
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'pointerup' })
        );
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'mouseup' })
        );
        expect(button.click).toHaveBeenCalled();
      });

      it('should use correct event options', () => {
        jest.spyOn(button, 'dispatchEvent');

        const result = executor.executeClickAction(button, 20);

        expect(result.success).toBe(true);
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        );
      });

      it('should trigger jQuery click if available', () => {
        const jQueryMock = jest.fn().mockReturnValue({
          length: 1,
          trigger: jest.fn(),
        });
        (window as any).jQuery = jQueryMock;

        const result = executor.executeClickAction(button, 20);

        expect(result.success).toBe(true);
        expect(jQueryMock).toHaveBeenCalledWith(button);
        expect(jQueryMock(button).trigger).toHaveBeenCalledWith('click');

        delete (window as any).jQuery;
      });

      it('should not trigger jQuery if not available', () => {
        delete (window as any).jQuery;

        const result = executor.executeClickAction(button, 20);

        expect(result.success).toBe(true);
      });
    });

    describe('unknown pattern', () => {
      it('should use pattern 20 behavior for unknown pattern', () => {
        jest.spyOn(button, 'dispatchEvent');
        jest.spyOn(button, 'click');

        const result = executor.executeClickAction(button, 999);

        expect(result.success).toBe(true);
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'pointerdown' })
        );
        expect(button.click).toHaveBeenCalled();
      });

      it('should default to pattern 20 when pattern is 0', () => {
        jest.spyOn(button, 'dispatchEvent');

        const result = executor.executeClickAction(button, 0);

        expect(result.success).toBe(true);
        expect(button.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'pointerdown' })
        );
      });
    });

    describe('error handling', () => {
      it('should handle errors gracefully', () => {
        const badElement = {
          click: () => {
            throw new Error('Click error');
          },
        } as any;

        const result = executor.executeClickAction(badElement, 10);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Click error');
      });

      it('should handle unknown errors', () => {
        const badElement = {
          click: () => {
            throw 'string error';
          },
        } as any;

        const result = executor.executeClickAction(badElement, 10);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown error');
      });
    });
  });
});
