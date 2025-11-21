/**
 * Test: ImportXPathsUseCase
 *
 * カバレッジ目標: 90%以上
 * テスト対象: CSV文字列からXPathエンティティへの変換とインポート処理
 */

import { ImportXPathsUseCase, ImportXPathsInput } from '../ImportXPathsUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { XPathCSVConverter } from '@domain/types/csv-converter.types';
import { Result } from '@domain/values/result.value';

// モック実装
const mockXPathRepository: jest.Mocked<XPathRepository> = {
  save: jest.fn(),
  load: jest.fn(),
  loadByWebsiteId: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  loadFromBatch: jest.fn(),
};

const mockWebsiteRepository: jest.Mocked<WebsiteRepository> = {
  save: jest.fn(),
  load: jest.fn(),
  loadByWebsiteId: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  loadFromBatch: jest.fn(),
};

const mockCSVConverter: jest.Mocked<XPathCSVConverter> = {
  fromCSV: jest.fn(),
  toCSV: jest.fn(),
};

describe('ImportXPathsUseCase', () => {
  let useCase: ImportXPathsUseCase;
  let useCaseWithWebsiteValidation: ImportXPathsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ImportXPathsUseCase(mockXPathRepository, mockCSVConverter);
    useCaseWithWebsiteValidation = new ImportXPathsUseCase(
      mockXPathRepository,
      mockCSVConverter,
      mockWebsiteRepository
    );
  });

  describe('正常系', () => {
    it('有効なCSVデータでインポートが成功すること', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockCSVConverter.fromCSV).toHaveBeenCalledWith(input.csvText);
      expect(mockXPathRepository.save).toHaveBeenCalledWith(expect.any(XPathCollection));
    });

    it('WebsiteRepository提供時にWebsiteId参照が有効な場合、インポートが成功すること', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];
      const mockWebsite = new Website({
        id: 'test-site',
        name: 'Test Site',
        updatedAt: new Date().toISOString(),
        editable: true,
        startUrl: 'https://example.com',
      });
      const mockWebsiteCollection = new WebsiteCollection([mockWebsite]);

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockWebsiteCollection));
      mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockWebsiteRepository.load).toHaveBeenCalled();
      expect(mockXPathRepository.save).toHaveBeenCalled();
    });

    it('websiteIdが空の場合、バリデーションをスキップしてインポートが成功すること', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'url,xpath\nhttps://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: '', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWebsiteRepository.load).not.toHaveBeenCalled();
      expect(mockXPathRepository.save).toHaveBeenCalled();
    });

    it('websiteIdがnullまたはundefinedの場合、バリデーションをスキップすること', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'url,xpath\nhttps://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: null as any, url: 'https://example.com', xpath: '//input[@id="test"]' },
        { websiteId: undefined as any, url: 'https://example2.com', xpath: '//input[@id="test2"]' },
      ];

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWebsiteRepository.load).not.toHaveBeenCalled();
    });

    it('重複するwebsiteIdがある場合、一意のIDのみでバリデーションすること', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText:
          'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test1"]\ntest-site,https://example.com,//input[@id="test2"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test1"]' },
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test2"]' },
      ];
      const mockWebsite = new Website({
        id: 'test-site',
        name: 'Test Site',
        updatedAt: new Date().toISOString(),
        editable: true,
        startUrl: 'https://example.com',
      });
      const mockWebsiteCollection = new WebsiteCollection([mockWebsite]);

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockWebsiteCollection));
      mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWebsiteRepository.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('異常系 - CSV変換エラー', () => {
    it('CSVConverter.fromCSVでエラーが発生した場合、エラーメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'invalid,csv,data',
      };
      const error = new Error('Invalid CSV format');
      mockCSVConverter.fromCSV.mockImplementation(() => {
        throw error;
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to import XPaths: Invalid CSV format');
      expect(mockXPathRepository.save).not.toHaveBeenCalled();
    });

    it('CSVConverter.fromCSVで非Errorオブジェクトがthrowされた場合、汎用エラーメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'invalid,csv,data',
      };
      mockCSVConverter.fromCSV.mockImplementation(() => {
        throw 'String error';
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to import XPaths: Invalid data');
    });
  });

  describe('異常系 - WebsiteId参照バリデーションエラー', () => {
    it('参照されたWebsiteIdが存在しない場合、エラーメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\nnonexistent-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'nonexistent-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];
      const mockWebsiteCollection = new WebsiteCollection([]);

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockWebsiteCollection));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Cannot import XPaths: Referenced websites not found (nonexistent-site)'
      );
      expect(result.error).toContain('Please import Websites CSV first');
      expect(mockXPathRepository.save).not.toHaveBeenCalled();
    });

    it('複数の存在しないWebsiteIdがある場合、すべてのIDをエラーメッセージに含むこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText:
          'websiteId,url,xpath\nsite1,https://example.com,//input[@id="test1"]\nsite2,https://example.com,//input[@id="test2"]',
      };
      const mockXPaths = [
        { websiteId: 'site1', url: 'https://example.com', xpath: '//input[@id="test1"]' },
        { websiteId: 'site2', url: 'https://example.com', xpath: '//input[@id="test2"]' },
      ];
      const mockWebsiteCollection = new WebsiteCollection([]);

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockWebsiteCollection));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('site1, site2');
    });

    it('WebsiteRepositoryの読み込みが失敗した場合、エラーメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];
      const error = new Error('Database connection failed');

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(mockXPathRepository.save).not.toHaveBeenCalled();
    });

    it('WebsiteRepositoryの読み込みでエラーメッセージがない場合、デフォルトメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.failure(null as any));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load websites for validation');
    });
  });

  describe('異常系 - XPathRepository保存エラー', () => {
    it('XPathRepositoryの保存が失敗した場合、エラーメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];
      const error = new Error('Storage quota exceeded');

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockXPathRepository.save.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save XPaths: Storage quota exceeded');
    });

    it('XPathRepositoryの保存でエラーメッセージがない場合、デフォルトメッセージを返すこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: 'websiteId,url,xpath\ntest-site,https://example.com,//input[@id="test"]',
      };
      const mockXPaths = [
        { websiteId: 'test-site', url: 'https://example.com', xpath: '//input[@id="test"]' },
      ];

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockXPathRepository.save.mockResolvedValue(Result.failure({ message: undefined } as any));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save XPaths: undefined');
    });
  });

  describe('エッジケース', () => {
    it('空のCSVデータでもインポートが成功すること', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText: '',
      };
      const mockXPaths: any[] = [];

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(mockXPathRepository.save).toHaveBeenCalledWith(expect.any(XPathCollection));
    });

    it('一部のWebsiteIdが存在し、一部が存在しない場合、存在しないIDのみエラーに含むこと', async () => {
      // Arrange
      const input: ImportXPathsInput = {
        csvText:
          'websiteId,url,xpath\nexisting-site,https://example.com,//input[@id="test1"]\nnonexistent-site,https://example.com,//input[@id="test2"]',
      };
      const mockXPaths = [
        { websiteId: 'existing-site', url: 'https://example.com', xpath: '//input[@id="test1"]' },
        {
          websiteId: 'nonexistent-site',
          url: 'https://example.com',
          xpath: '//input[@id="test2"]',
        },
      ];
      const mockWebsite = new Website({
        id: 'existing-site',
        name: 'Existing Site',
        updatedAt: new Date().toISOString(),
        editable: true,
        startUrl: 'https://example.com',
      });
      const mockWebsiteCollection = new WebsiteCollection([mockWebsite]);

      mockCSVConverter.fromCSV.mockReturnValue(mockXPaths);
      mockWebsiteRepository.load.mockResolvedValue(Result.success(mockWebsiteCollection));

      // Act
      const result = await useCaseWithWebsiteValidation.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('nonexistent-site');
      expect(result.error).not.toContain('existing-site');
    });
  });
});
