import { AutoFillEvent, DEFAULT_EVENTS } from '../AutoFillEvent';

describe('AutoFillEvent', () => {
  it('should have default events defined', () => {
    expect(DEFAULT_EVENTS).toBeDefined();
    expect(DEFAULT_EVENTS.length).toBeGreaterThan(0);
  });

  it('should have click event in default events', () => {
    const clickEvent = DEFAULT_EVENTS.find(event => event.eventType === 'click');
    
    expect(clickEvent).toBeDefined();
    expect(clickEvent?.name).toBe('Click');
    expect(clickEvent?.id).toBe(1);
  });

  it('should have all required properties in default events', () => {
    DEFAULT_EVENTS.forEach(event => {
      expect(event.id).toBeDefined();
      expect(event.name).toBeDefined();
      expect(event.eventType).toBeDefined();
      expect(typeof event.id).toBe('number');
      expect(typeof event.name).toBe('string');
      expect(typeof event.eventType).toBe('string');
    });
  });
});
