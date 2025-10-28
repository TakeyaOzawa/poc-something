/**
 * Unit Tests: ExportAutomationVariablesUseCase
 */

import { ExportAutomationVariablesUseCase } from '../ExportAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariablesCSVConverter } from '@domain/types/csv-converter.types';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Result } from '@domain/values/result.value';

describe('ExportAutomationVariablesUseCase', () => {
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;
  let mockCSVConverter: jest.Mocked<AutomationVariablesCSVConverter>;
  let useCase: ExportAutomationVariablesUseCase;

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

    useCase = new ExportAutomationVariablesUseCase(mockRepository, mockCSVConverter);
  });

  describe('execute', () => {
    it('should return CSV string from repository automation variables', async () => {
      const variablesObjects = sampleVariablesData.map((data) => new AutomationVariables(data));
      mockRepository.loadAll.mockResolvedValue(Result.success(variablesObjects));

      const csvString =
        'website_id,status,variables,updated_at\nwebsite_1,enabled,"{""username"":""user1""}",2025-01-08T10:30:00.000Z\nwebsite_2,disabled,"{""email"":""test@example.com""}",2025-01-08T10:31:00.000Z';
      mockCSVConverter.toCSV.mockReturnValue(csvString);

      const result = await useCase.execute();

      expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
      expect(mockCSVConverter.toCSV).toHaveBeenCalledWith(sampleVariablesData);
      expect(typeof result.csvText).toBe('string');
      expect(result.csvText).toContain('website_id,status,variables,updated_at');
      expect(result.csvText).toContain('website_1');
      expect(result.csvText).toContain('website_2');
    });

    it('should return CSV with header only when no automation variables exist', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.success([]));

      const csvString = 'website_id,status,variables,updated_at';
      mockCSVConverter.toCSV.mockReturnValue(csvString);

      const result = await useCase.execute();

      expect(mockCSVConverter.toCSV).toHaveBeenCalledWith([]);
      expect(typeof result.csvText).toBe('string');
      expect(result.csvText).toBe('website_id,status,variables,updated_at');
    });

    it('should throw error when repository returns failure', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.failure(new Error('Repository error')));

      await expect(useCase.execute()).rejects.toThrow(
        'Failed to load automation variables: Repository error'
      );
    });

    it('should handle variables with different statuses in CSV', async () => {
      const enabledVar = AutomationVariables.create({
        websiteId: 'w1',
        status: AUTOMATION_STATUS.ENABLED,
        variables: { key: 'value' },
      });
      const disabledVar = AutomationVariables.create({
        websiteId: 'w2',
        status: AUTOMATION_STATUS.DISABLED,
      });
      const onceVar = AutomationVariables.create({
        websiteId: 'w3',
        status: AUTOMATION_STATUS.ONCE,
      });

      mockRepository.loadAll.mockResolvedValue(Result.success([enabledVar, disabledVar, onceVar]));

      const csvString = `website_id,status,variables,updated_at
w1,${AUTOMATION_STATUS.ENABLED},"{}",2025-01-08T10:30:00.000Z
w2,${AUTOMATION_STATUS.DISABLED},"{}",2025-01-08T10:30:00.000Z
w3,${AUTOMATION_STATUS.ONCE},"{}",2025-01-08T10:30:00.000Z`;
      mockCSVConverter.toCSV.mockReturnValue(csvString);

      const result = await useCase.execute();

      expect(typeof result.csvText).toBe('string');
      expect(result.csvText).toContain('w1');
      expect(result.csvText).toContain('w2');
      expect(result.csvText).toContain('w3');
      expect(result.csvText).toContain(AUTOMATION_STATUS.ENABLED);
      expect(result.csvText).toContain(AUTOMATION_STATUS.DISABLED);
      expect(result.csvText).toContain(AUTOMATION_STATUS.ONCE);
    });

    it('should return CSV with correct format', async () => {
      const testVar = AutomationVariables.create({
        websiteId: 'test_website',
        variables: { username: 'testuser', email: 'test@test.com' },
        status: AUTOMATION_STATUS.ENABLED,
      });

      mockRepository.loadAll.mockResolvedValue(Result.success([testVar]));

      const csvString = `website_id,status,variables,updated_at
test_website,${AUTOMATION_STATUS.ENABLED},"{}",2025-01-08T10:30:00.000Z`;
      mockCSVConverter.toCSV.mockReturnValue(csvString);

      const result = await useCase.execute();

      expect(typeof result.csvText).toBe('string');
      expect(result.csvText).toContain('website_id,status,variables,updated_at');
      expect(result.csvText).toContain('test_website');
      expect(result.csvText).toContain(AUTOMATION_STATUS.ENABLED);
    });
  });
});
