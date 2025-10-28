/**
 * Unit Tests: AutomationVariablesMapper
 */

import { AutomationVariablesMapper } from '../AutomationVariablesMapper';
import { AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Logger } from '@domain/types/logger.types';

describe('AutomationVariablesMapper', () => {
  const sampleVariablesData: AutomationVariablesData[] = [
    {
      id: 'id-1',
      websiteId: 'website_1',
      variables: { username: 'user1', password: 'pass1' },
      status: AUTOMATION_STATUS.ENABLED,
      updatedAt: '2025-01-08T10:30:00.000Z',
    },
    {
      id: 'id-2',
      websiteId: 'website_2',
      variables: { email: 'test@example.com' },
      status: AUTOMATION_STATUS.DISABLED,
      updatedAt: '2025-01-08T10:31:00.000Z',
    },
    {
      id: 'id-3',
      websiteId: 'website_3',
      variables: {},
      status: AUTOMATION_STATUS.ONCE,
      updatedAt: '2025-01-08T10:32:00.000Z',
    },
  ];

  describe('toCSV', () => {
    it('should convert array to CSV string with proper header', () => {
      const csv = AutomationVariablesMapper.toCSV(sampleVariablesData);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('"id","status","updatedAt","variables","websiteId"');
      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('should properly format CSV rows with quoted fields', () => {
      const csv = AutomationVariablesMapper.toCSV(sampleVariablesData);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"enabled"');
      expect(lines[1]).toContain('"website_1"');
      expect(lines[1]).toContain('"2025-01-08T10:30:00.000Z"');
    });

    it('should handle empty array', () => {
      const csv = AutomationVariablesMapper.toCSV([]);
      expect(csv).toBe('"id","status","updatedAt","variables","websiteId"');
    });

    it('should JSON-stringify variables field', () => {
      const csv = AutomationVariablesMapper.toCSV(sampleVariablesData);
      const lines = csv.split('\n');

      // JSON quotes are escaped as "" in CSV format
      expect(lines[1]).toContain('{""username"":""user1"",""password"":""pass1""}');
    });

    it('should handle variables without status', () => {
      const dataWithoutStatus: AutomationVariablesData[] = [
        {
          id: 'id-w1',
          websiteId: 'w1',
          variables: { key: 'value' },
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
      ];

      const csv = AutomationVariablesMapper.toCSV(dataWithoutStatus);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"",');
      expect(lines[1]).toContain('"w1"');
    });
  });

  describe('fromCSV', () => {
    it('should parse valid CSV to array', () => {
      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z","{""username"":""user1"",""password"":""pass1""}","website_1"`;
      const result = AutomationVariablesMapper.fromCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].websiteId).toBe('website_1');
      expect(result[0].variables).toEqual({ username: 'user1', password: 'pass1' });
      expect(result[0].status).toBe(AUTOMATION_STATUS.ENABLED);
    });

    it('should handle empty CSV (header only)', () => {
      const csv = '"status","updatedAt","variables","websiteId"';

      expect(() => AutomationVariablesMapper.fromCSV(csv)).toThrow(
        'Invalid CSV format: no data rows'
      );
    });

    it('should throw error for CSV with no data rows', () => {
      const csv = '"status","updatedAt","variables","websiteId"\n';

      expect(() => AutomationVariablesMapper.fromCSV(csv)).toThrow(
        'Invalid CSV format: no data rows'
      );
    });

    it('should skip lines without websiteId', () => {
      const mockLogger: jest.Mocked<Logger> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn(),
      };

      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z","{}","w1"\n"disabled","2025-01-08T10:30:00.000Z","{}",""\n"once","2025-01-08T10:30:00.000Z","{}","w2"`;

      const result = AutomationVariablesMapper.fromCSV(csv, mockLogger);

      expect(result).toHaveLength(2);
      expect(result[0].websiteId).toBe('w1');
      expect(result[1].websiteId).toBe('w2');
      expect(mockLogger.warn).toHaveBeenCalledWith('Skipping line 3: missing websiteId');
    });

    it('should skip lines with invalid status', () => {
      const mockLogger: jest.Mocked<Logger> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn(),
      };

      const csv = `"status","updatedAt","variables","websiteId"\n"invalid_status","2025-01-08T10:30:00.000Z","{}","w1"`;

      const result = AutomationVariablesMapper.fromCSV(csv, mockLogger);

      expect(result).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid status on line 2: invalid_status, skipping'
      );
    });

    it('should handle invalid variables JSON format', () => {
      const mockLogger: jest.Mocked<Logger> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn(),
      };

      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z","not valid json","w1"`;

      const result = AutomationVariablesMapper.fromCSV(csv, mockLogger);

      expect(result).toHaveLength(1);
      expect(result[0].variables).toEqual({});
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to parse variables JSON on line 2, using empty object'
      );
    });

    it('should default updatedAt if missing', () => {
      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","","{}","w1"`;

      const result = AutomationVariablesMapper.fromCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].updatedAt).toBeDefined();
      expect(typeof result[0].updatedAt).toBe('string');
    });

    it('should handle all valid website statuses', () => {
      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z","{}","w1"\n"disabled","2025-01-08T10:30:00.000Z","{}","w2"\n"once","2025-01-08T10:30:00.000Z","{}","w3"`;

      const result = AutomationVariablesMapper.fromCSV(csv);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(AUTOMATION_STATUS.ENABLED);
      expect(result[1].status).toBe(AUTOMATION_STATUS.DISABLED);
      expect(result[2].status).toBe(AUTOMATION_STATUS.ONCE);
    });

    it('should handle complex variables objects', () => {
      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z","{""username"":""testuser"",""password"":""testpass"",""email"":""test@test.com"",""phone"":""123-456-7890""}","w1"`;

      const result = AutomationVariablesMapper.fromCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].variables).toEqual({
        username: 'testuser',
        password: 'testpass',
        email: 'test@test.com',
        phone: '123-456-7890',
      });
    });

    it('should skip lines with insufficient columns', () => {
      const mockLogger: jest.Mocked<Logger> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn(),
      };

      const csv = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z"\n"disabled","2025-01-08T10:30:00.000Z","{}","w2"`;

      const result = AutomationVariablesMapper.fromCSV(csv, mockLogger);

      expect(result).toHaveLength(1);
      expect(result[0].websiteId).toBe('w2');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping line 2: insufficient columns')
      );
    });

    it('should handle empty status field', () => {
      const csv = `"status","updatedAt","variables","websiteId"\n"","2025-01-08T10:30:00.000Z","{}","w1"`;

      const result = AutomationVariablesMapper.fromCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBeUndefined();
    });

    it('should round-trip correctly', () => {
      const csv = AutomationVariablesMapper.toCSV(sampleVariablesData);
      const parsed = AutomationVariablesMapper.fromCSV(csv);

      // CSV now includes id field in new 5-column format
      // Compare all fields including id
      expect(parsed.length).toBe(sampleVariablesData.length);
      parsed.forEach((item, index) => {
        expect(item.websiteId).toBe(sampleVariablesData[index].websiteId);
        expect(item.variables).toEqual(sampleVariablesData[index].variables);
        expect(item.status).toBe(sampleVariablesData[index].status);
        expect(item.updatedAt).toBe(sampleVariablesData[index].updatedAt);
        expect(item.id).toBe(sampleVariablesData[index].id); // CSV now includes id
      });
    });
  });
});
