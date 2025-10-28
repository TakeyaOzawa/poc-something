/**
 * Unit Tests: XPath Use Cases (GetAll, Update, Delete, Export, Import)
 */

import { GetAllXPathsUseCase } from '../GetAllXPathsUseCase';
import { UpdateXPathUseCase } from '../UpdateXPathUseCase';
import { DeleteXPathUseCase } from '../DeleteXPathUseCase';
import { ExportXPathsUseCase } from '../ExportXPathsUseCase';
import { ImportXPathsUseCase } from '../ImportXPathsUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCSVConverter } from '@domain/types/csv-converter.types';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';

describe('XPath Use Cases', () => {
  let mockRepository: jest.Mocked<XPathRepository>;
  let mockCSVConverter: jest.Mocked<XPathCSVConverter>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    mockCSVConverter = {
      toCSV: jest.fn(),
      fromCSV: jest.fn(),
    } as jest.Mocked<XPathCSVConverter>;
  });

  describe('GetAllXPathsUseCase', () => {
    it('should return all XPaths from collection', async () => {
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          value: 'Test Value 1',
        })
      );

      mockRepository.load.mockResolvedValue(Result.success(collection));

      const useCase = new GetAllXPathsUseCase(mockRepository);
      const result = await useCase.execute();

      expect(result.xpaths).toHaveLength(1);
      expect(result.xpaths[0].value).toBe('Test Value 1');
    });
  });

  describe('UpdateXPathUseCase', () => {
    it('should update an existing XPath', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());
      const allXPaths = collection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const useCase = new UpdateXPathUseCase(mockRepository);
      const result = await useCase.execute({
        id: xpath.id,
        value: 'Updated Value',
      });

      expect(result).not.toBeNull();
      expect(result?.xpath?.value).toBe('Updated Value');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return null when XPath not found', async () => {
      const collection = new XPathCollection();
      mockRepository.load.mockResolvedValue(Result.success(collection));

      const useCase = new UpdateXPathUseCase(mockRepository);
      const result = await useCase.execute({
        id: 'non-existent-id',
        value: 'Updated Value',
      });

      expect(result.xpath).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteXPathUseCase', () => {
    it('should delete an existing XPath', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData());
      const allXPaths = collection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const useCase = new DeleteXPathUseCase(mockRepository);
      const result = await useCase.execute({ id: xpath.id });

      expect(result.deleted).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return false when XPath not found', async () => {
      const collection = new XPathCollection();
      mockRepository.load.mockResolvedValue(Result.success(collection));

      const useCase = new DeleteXPathUseCase(mockRepository);
      const result = await useCase.execute({ id: 'non-existent-id' });

      expect(result.deleted).toBe(false);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('ExportXPathsUseCase', () => {
    it('should export XPaths as CSV string', async () => {
      let collection = new XPathCollection();
      collection = collection.add(
        createTestXPathData({
          value: 'Test Value',
        })
      );

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockCSVConverter.toCSV.mockReturnValue('id,name,xpath\ntest,test,/test');

      const useCase = new ExportXPathsUseCase(mockRepository, mockCSVConverter);
      const result = await useCase.execute();

      expect(result.csv).toBeDefined();
      expect(typeof result.csv).toBe('string');
      expect(result.csv).toContain('id,name,xpath');
    });
  });

  describe('ImportXPathsUseCase', () => {
    it('should import XPaths from CSV string', async () => {
      const csvData = `id,name,xpath,action_type,value,order,website_id,wait_for_options,updated_at
test-id-1,Test XPath 1,/html/body,click,,1,website_1,false,2025-01-08T10:30:00.000Z
test-id-2,Test XPath 2,/html/body/input,sendkeys,Test Value,2,website_1,false,2025-01-08T10:31:00.000Z`;

      mockCSVConverter.fromCSV.mockReturnValue([
        {
          id: 'test-id-1',
          ...createTestXPathData({ websiteId: 'website_1' }),
        },
      ]);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const useCase = new ImportXPathsUseCase(mockRepository, mockCSVConverter);
      await useCase.execute({ csvText: csvData });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return failure when importing invalid CSV', async () => {
      mockCSVConverter.fromCSV.mockImplementation(() => {
        throw new Error('Invalid CSV');
      });

      const useCase = new ImportXPathsUseCase(mockRepository, mockCSVConverter);

      const invalidCSV = 'invalid,csv,data';

      const result = await useCase.execute({ csvText: invalidCSV });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to import XPaths: Invalid CSV');
    });
  });
});
