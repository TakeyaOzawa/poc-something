/**
 * Unit Tests: ImportWebsitesUseCase
 */

import { ImportWebsitesUseCase } from '../ImportWebsitesUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCSVConverter } from '@domain/types/csv-converter.types';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { WebsiteData } from '@domain/entities/Website';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ImportWebsitesUseCase', () => {
  let mockWebsiteRepository: jest.Mocked<WebsiteRepository>;
  let mockCSVConverter: jest.Mocked<WebsiteCSVConverter>;
  let useCase: ImportWebsitesUseCase;

  const validCSV = `id,name,start_url,updated_at,editable
website_1,Example Site,https://example.com,2025-01-08T10:30:00.000Z,true
website_2,Test Site,https://test.com,2025-01-08T10:31:00.000Z,false`;

  const sampleWebsites: WebsiteData[] = [
    {
      id: 'website_1',
      name: 'Example Site',
      startUrl: 'https://example.com',
      updatedAt: '2025-01-08T10:30:00.000Z',
      editable: true,
    },
    {
      id: 'website_2',
      name: 'Test Site',
      startUrl: 'https://test.com',
      updatedAt: '2025-01-08T10:31:00.000Z',
      editable: false,
    },
  ];

  beforeEach(() => {
    mockWebsiteRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<WebsiteRepository>;

    mockCSVConverter = {
      toCSV: jest.fn(),
      fromCSV: jest.fn(),
    } as jest.Mocked<WebsiteCSVConverter>;

    useCase = new ImportWebsitesUseCase(mockWebsiteRepository, mockCSVConverter);
  });

  describe('execute', () => {
    it('should import websites from CSV and save to repository', async () => {
      mockCSVConverter.fromCSV.mockReturnValue(sampleWebsites);
      mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));

      const output = await useCase.execute({ csvText: validCSV });

      expect(output.success).toBe(true);
      expect(mockCSVConverter.fromCSV).toHaveBeenCalledWith(validCSV);
      expect(mockWebsiteRepository.save).toHaveBeenCalledTimes(1);
      const savedCollection = mockWebsiteRepository.save.mock.calls[0][0] as WebsiteCollection;
      const savedData = savedCollection.getAll().map((w) => w.toData());
      expect(savedData).toHaveLength(2);
      expect(savedData[0].id).toBe('website_1');
      expect(savedData[0].name).toBe('Example Site');
    });

    it('should return failure on CSV parse error', async () => {
      mockCSVConverter.fromCSV.mockImplementation(() => {
        throw new Error('Invalid CSV format: no data rows');
      });
      mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
      const headerOnlyCSV = 'id,name,start_url,updated_at,editable';

      const output = await useCase.execute({ csvText: headerOnlyCSV });

      expect(output.success).toBe(false);
      expect(output.error).toContain('Failed to import websites: Invalid CSV format: no data rows');
    });

    it('should return failure when repository save fails', async () => {
      mockCSVConverter.fromCSV.mockReturnValue(sampleWebsites);
      mockWebsiteRepository.save.mockResolvedValue(Result.failure(new Error('Save error')));

      const output = await useCase.execute({ csvText: validCSV });

      expect(output.success).toBe(false);
      expect(output.error).toContain('Save error');
    });

    it('should return failure with generic message for unknown errors', async () => {
      mockCSVConverter.fromCSV.mockReturnValue(sampleWebsites);
      mockWebsiteRepository.save.mockRejectedValue('Unknown error');

      const output = await useCase.execute({ csvText: validCSV });

      expect(output.success).toBe(false);
      expect(output.error).toContain('Failed to import websites');
    });
  });
});
