import { MessageTypes, isValidMessageType } from '@domain/types/messaging';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('MessageTypes', () => {
  it('should have all required message types', () => {
    expect(MessageTypes.EXECUTE_AUTO_FILL).toBe('executeAutoFill');
    expect(MessageTypes.GET_XPATH).toBe('getXPath');
    expect(MessageTypes.SHOW_XPATH_DIALOG).toBe('showXPathDialog');
  });

  describe('isValidMessageType', () => {
    it('should return true for valid message types', () => {
      expect(isValidMessageType('executeAutoFill')).toBe(true);
      expect(isValidMessageType('getXPath')).toBe(true);
      expect(isValidMessageType('showXPathDialog')).toBe(true);
    });

    it('should return false for invalid message types', () => {
      expect(isValidMessageType('invalidAction')).toBe(false);
      expect(isValidMessageType('')).toBe(false);
      expect(isValidMessageType('random')).toBe(false);
    });
  });
});
