/**
 * Unit Tests: ImportAutomationVariablesUseCase
 */

import { ImportAutomationVariablesUseCase } from '../ImportAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariablesCSVConverter } from '@domain/types/csv-converter.types';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ImportAutomationVariablesUseCase', () => {
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;
  let mockCSVConverter: jest.Mocked<AutomationVariablesCSVConverter>;
  let useCase: ImportAutomationVariablesUseCase;

  const validCSV = `website_id,status,variables,updated_at
website_1,enabled,"{""username"":""user1"",""password"":""pass1""}",2025-01-08T10:30:00.000Z
website_2,disabled,"{""email"":""test@example.com""}",2025-01-08T10:31:00.000Z
website_3,once,"{}",2025-01-08T10:32:00.000Z`;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    } as jest.Mocked<AutomationVariablesRepository>;

    mockCSVConverter = {
      toCSV: jest.fn(),
      fromCSV: jest.fn(),
    } as jest.Mocked<AutomationVariablesCSVConverter>;

    useCase = new ImportAutomationVariablesUseCase(mockRepository, mockCSVConverter);
  });

  describe('execute', () => {
    it('should import automation variables from CSV and save to repository', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-1',
          websiteId: 'website_1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: { username: 'user1', password: 'pass1' },
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
        {
          id: 'id-2',
          websiteId: 'website_2',
          status: AUTOMATION_STATUS.DISABLED,
          variables: { email: 'test@example.com' },
          updatedAt: '2025-01-08T10:31:00.000Z',
        },
        {
          id: 'id-3',
          websiteId: 'website_3',
          status: AUTOMATION_STATUS.ONCE,
          variables: {},
          updatedAt: '2025-01-08T10:32:00.000Z',
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await useCase.execute({ csvText: validCSV });

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
      // Verify each save was called with AutomationVariables entity
      mockRepository.save.mock.calls.forEach((call) => {
        expect(call[0]).toBeInstanceOf(AutomationVariables);
      });
    });

    it('should handle CSV with header only', async () => {
      mockCSVConverter.fromCSV.mockImplementation(() => {
        throw new Error('Invalid CSV format: no data rows');
      });
      const headerOnlyCSV = 'website_id,status,variables,updated_at';

      const result = await useCase.execute({ csvText: headerOnlyCSV });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to import automation variables');
    });

    it('should handle single automation variable in CSV', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-1',
          websiteId: 'website_1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: { username: 'user1' },
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.success(undefined));
      const singleVariableCSV = `website_id,status,variables,updated_at
website_1,enabled,"{""username"":""user1""}",2025-01-08T10:30:00.000Z`;

      await useCase.execute({ csvText: singleVariableCSV });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedVariable = (mockRepository.save.mock.calls[0][0] as AutomationVariables).toData();
      expect(savedVariable.websiteId).toBe('website_1');
    });

    it('should return failure when repository save returns failure', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-1',
          websiteId: 'website_1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: {},
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.failure(new Error('Repository save error')));

      const result = await useCase.execute({ csvText: validCSV });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save automation variable: Repository save error');
    });

    it('should handle variables with different statuses from CSV', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-w1',
          websiteId: 'w1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: {},
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
        {
          id: 'id-w2',
          websiteId: 'w2',
          status: AUTOMATION_STATUS.DISABLED,
          variables: {},
          updatedAt: '2025-01-08T10:31:00.000Z',
        },
        {
          id: 'id-w3',
          websiteId: 'w3',
          status: AUTOMATION_STATUS.ONCE,
          variables: {},
          updatedAt: '2025-01-08T10:32:00.000Z',
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.success(undefined));
      const statusCSV = `website_id,status,variables,updated_at
w1,enabled,"{}",2025-01-08T10:30:00.000Z
w2,disabled,"{}",2025-01-08T10:31:00.000Z
w3,once,"{}",2025-01-08T10:32:00.000Z`;

      await useCase.execute({ csvText: statusCSV });

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
      const statuses = mockRepository.save.mock.calls.map((call) => {
        const savedVariable = (call[0] as AutomationVariables).toData();
        return savedVariable.status;
      });
      expect(statuses).toContain(AUTOMATION_STATUS.ENABLED);
      expect(statuses).toContain(AUTOMATION_STATUS.DISABLED);
      expect(statuses).toContain(AUTOMATION_STATUS.ONCE);
    });

    it('should handle variables with complex variable objects from CSV', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-w1',
          websiteId: 'w1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: { username: 'testuser', password: 'testpass', email: 'test@test.com' },
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.success(undefined));
      const complexCSV = `website_id,status,variables,updated_at
w1,enabled,"{""username"":""testuser"",""password"":""testpass"",""email"":""test@test.com""}",2025-01-08T10:30:00.000Z`;

      await useCase.execute({ csvText: complexCSV });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedVariable = (mockRepository.save.mock.calls[0][0] as AutomationVariables).toData();
      expect(savedVariable.variables).toHaveProperty('username');
      expect(savedVariable.variables).toHaveProperty('password');
      expect(savedVariable.variables).toHaveProperty('email');
    });

    it('should handle partial save failure and return error', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-1',
          websiteId: 'website_1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: {},
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
        {
          id: 'id-2',
          websiteId: 'website_2',
          status: AUTOMATION_STATUS.DISABLED,
          variables: {},
          updatedAt: '2025-01-08T10:31:00.000Z',
        },
      ]);
      // First save succeeds, second fails
      mockRepository.save
        .mockResolvedValueOnce(Result.success(undefined))
        .mockResolvedValueOnce(Result.failure(new Error('Save failed for second item')));

      const result = await useCase.execute({ csvText: validCSV });

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Failed to save automation variable: Save failed for second item'
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should create AutomationVariables entities before saving', async () => {
      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'id-1',
          websiteId: 'website_1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: {},
          updatedAt: '2025-01-08T10:30:00.000Z',
        },
        {
          id: 'id-2',
          websiteId: 'website_2',
          status: AUTOMATION_STATUS.DISABLED,
          variables: {},
          updatedAt: '2025-01-08T10:31:00.000Z',
        },
        {
          id: 'id-3',
          websiteId: 'website_3',
          status: AUTOMATION_STATUS.ONCE,
          variables: {},
          updatedAt: '2025-01-08T10:32:00.000Z',
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await useCase.execute({ csvText: validCSV });

      // Verify that AutomationVariables entities were created
      mockRepository.save.mock.calls.forEach((call) => {
        expect(call[0]).toBeInstanceOf(AutomationVariables);
      });
    });
  });
});
