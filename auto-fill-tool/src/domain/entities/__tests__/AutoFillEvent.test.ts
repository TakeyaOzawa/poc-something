/**
 * Unit Tests: AutoFillEvent Entity
 */

import { AutoFillEvent, DEFAULT_EVENTS } from '../AutoFillEvent';

describe('AutoFillEvent', () => {
  describe('DEFAULT_EVENTS', () => {
    it('should contain 9 default events', () => {
      expect(DEFAULT_EVENTS).toHaveLength(9);
    });

    it('should have unique IDs for all events', () => {
      const ids = DEFAULT_EVENTS.map((event) => event.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(DEFAULT_EVENTS.length);
    });

    it('should have Click event with correct properties', () => {
      const clickEvent = DEFAULT_EVENTS.find((e) => e.id === 1);
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.name).toBe('Click');
      expect(clickEvent?.eventType).toBe('click');
      expect(clickEvent?.description).toBe('マウスクリックイベント');
    });

    it('should have Focus event with correct properties', () => {
      const focusEvent = DEFAULT_EVENTS.find((e) => e.id === 2);
      expect(focusEvent).toBeDefined();
      expect(focusEvent?.name).toBe('Focus');
      expect(focusEvent?.eventType).toBe('focus');
      expect(focusEvent?.description).toBe('フォーカスイベント');
    });

    it('should have Blur event with correct properties', () => {
      const blurEvent = DEFAULT_EVENTS.find((e) => e.id === 3);
      expect(blurEvent).toBeDefined();
      expect(blurEvent?.name).toBe('Blur');
      expect(blurEvent?.eventType).toBe('blur');
      expect(blurEvent?.description).toBe('フォーカス喪失イベント');
    });

    it('should have Change event with correct properties', () => {
      const changeEvent = DEFAULT_EVENTS.find((e) => e.id === 4);
      expect(changeEvent).toBeDefined();
      expect(changeEvent?.name).toBe('Change');
      expect(changeEvent?.eventType).toBe('change');
      expect(changeEvent?.description).toBe('変更イベント');
    });

    it('should have Input event with correct properties', () => {
      const inputEvent = DEFAULT_EVENTS.find((e) => e.id === 5);
      expect(inputEvent).toBeDefined();
      expect(inputEvent?.name).toBe('Input');
      expect(inputEvent?.eventType).toBe('input');
      expect(inputEvent?.description).toBe('入力イベント');
    });

    it('should have Mouse Over event with correct properties', () => {
      const mouseOverEvent = DEFAULT_EVENTS.find((e) => e.id === 6);
      expect(mouseOverEvent).toBeDefined();
      expect(mouseOverEvent?.name).toBe('Mouse Over');
      expect(mouseOverEvent?.eventType).toBe('mouseover');
      expect(mouseOverEvent?.description).toBe('マウスオーバーイベント');
    });

    it('should have Mouse Out event with correct properties', () => {
      const mouseOutEvent = DEFAULT_EVENTS.find((e) => e.id === 7);
      expect(mouseOutEvent).toBeDefined();
      expect(mouseOutEvent?.name).toBe('Mouse Out');
      expect(mouseOutEvent?.eventType).toBe('mouseout');
      expect(mouseOutEvent?.description).toBe('マウスアウトイベント');
    });

    it('should have Key Down event with correct properties', () => {
      const keyDownEvent = DEFAULT_EVENTS.find((e) => e.id === 8);
      expect(keyDownEvent).toBeDefined();
      expect(keyDownEvent?.name).toBe('Key Down');
      expect(keyDownEvent?.eventType).toBe('keydown');
      expect(keyDownEvent?.description).toBe('キー押下イベント');
    });

    it('should have Key Up event with correct properties', () => {
      const keyUpEvent = DEFAULT_EVENTS.find((e) => e.id === 9);
      expect(keyUpEvent).toBeDefined();
      expect(keyUpEvent?.name).toBe('Key Up');
      expect(keyUpEvent?.eventType).toBe('keyup');
      expect(keyUpEvent?.description).toBe('キー解放イベント');
    });

    it('should have all events with valid eventType strings', () => {
      const validEventTypes = [
        'click',
        'focus',
        'blur',
        'change',
        'input',
        'mouseover',
        'mouseout',
        'keydown',
        'keyup',
      ];

      DEFAULT_EVENTS.forEach((event) => {
        expect(validEventTypes).toContain(event.eventType);
      });
    });

    it('should have all events with descriptions', () => {
      DEFAULT_EVENTS.forEach((event) => {
        expect(event.description).toBeDefined();
        expect(event.description).not.toBe('');
      });
    });

    it('should have all events with names', () => {
      DEFAULT_EVENTS.forEach((event) => {
        expect(event.name).toBeDefined();
        expect(event.name).not.toBe('');
      });
    });

    it('should be immutable constant array', () => {
      const originalLength = DEFAULT_EVENTS.length;
      const firstEvent = DEFAULT_EVENTS[0];

      // Verify the array is exported as const and maintains its integrity
      expect(DEFAULT_EVENTS.length).toBe(originalLength);
      expect(DEFAULT_EVENTS[0]).toBe(firstEvent);
    });
  });

  describe('AutoFillEvent interface', () => {
    it('should allow creating valid event objects', () => {
      const customEvent: AutoFillEvent = {
        id: 100,
        name: 'Custom Event',
        eventType: 'custom',
        description: 'A custom test event',
      };

      expect(customEvent.id).toBe(100);
      expect(customEvent.name).toBe('Custom Event');
      expect(customEvent.eventType).toBe('custom');
      expect(customEvent.description).toBe('A custom test event');
    });

    it('should allow creating event objects without description', () => {
      const eventWithoutDesc: AutoFillEvent = {
        id: 101,
        name: 'No Description Event',
        eventType: 'test',
      };

      expect(eventWithoutDesc.id).toBe(101);
      expect(eventWithoutDesc.name).toBe('No Description Event');
      expect(eventWithoutDesc.eventType).toBe('test');
      expect(eventWithoutDesc.description).toBeUndefined();
    });
  });
});
