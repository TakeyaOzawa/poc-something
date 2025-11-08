/**
 * Unit Tests: ExportWebsitesUseCase
 */

import { ExportWebsitesUseCase } from '../ExportWebsitesUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCSVConverter } from '@domain/types/csv-converter.types';
import { Website, WebsiteData } from '@domain/entities/Website';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ExportWebsitesUseCase', () => {
  let mockWebsiteRepository: jest.Mocked<WebsiteRepository>;
  let mockCSVConverter: jest.Mocked<WebsiteCSVConverter>;
  let useCase: ExportWebsitesUseCase;

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

    useCase = new ExportWebsitesUseCase(mockWebsiteRepository, mockCSVConverter);
  });

  describe('execute', () => {
    it('should return CSV string from repository websites', async () => {
      const websiteObjects = sampleWebsites.map((data) => new Website(data));
      const mockCollection = new WebsiteCollection(websiteObjects);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockCollection));

      const csvString =
        'id,name,start_url,updated_at,editable\nwebsite_1,Example Site,https://example.com,2025-01-08T10:30:00.000Z,true';
      mockCSVConverter.toCSV.mockReturnValue(csvString);

      const output = await useCase.execute();

      expect(output.success).toBe(true);
      expect(mockWebsiteRepository.load).toHaveBeenCalledTimes(1);
      expect(mockCSVConverter.toCSV).toHaveBeenCalledWith(sampleWebsites);
      expect(typeof output.csvText).toBe('string');
      expect(output.csvText).toContain('id,name,start_url,updated_at,editable');
      expect(output.csvText).toContain('website_1');
      expect(output.csvText).toContain('Example Site');
      expect(output.csvText).toContain('https://example.com');
    });

    it('should return CSV with header only when no websites exist', async () => {
      const mockCollection = new WebsiteCollection([]);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockCollection));

      const csvString = 'id,name,start_url,updated_at,editable';
      mockCSVConverter.toCSV.mockReturnValue(csvString);

      const output = await useCase.execute();

      expect(output.success).toBe(true);
      expect(mockCSVConverter.toCSV).toHaveBeenCalledWith([]);
      expect(typeof output.csvText).toBe('string');
      expect(output.csvText).toBe('id,name,start_url,updated_at,editable');
    });

    it('should return failure when repository fails', async () => {
      mockWebsiteRepository.load.mockResolvedValue(Result.failure(new Error('Repository error')));

      const output = await useCase.execute();

      expect(output.success).toBe(false);
      expect(output.error).toBeDefined();
    });
  });
});
