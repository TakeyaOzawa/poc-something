/**
 * Unit Tests: ExportImportManager
 */

import { ExportImportManager } from '../ExportImportManager';
import { XPathManagerPresenter } from '../XPathManagerPresenter';
// Update the import path to the correct location of Logger
import { Logger } from '@domain/types/logger.types';
import { TemplateLoader } from '@presentation/common/TemplateLoader';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  i18n: {
    getMessage: jest.fn((key: string) => {
      // Return the key as default, or specific mock values if needed
      return key;
    }),
  },
}));

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        exportXPaths: 'XPathsをエクスポート',
        exportWebsites: 'Websitesをエクスポート',
        exportAutomationVariables: 'Automation Variablesをエクスポート',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...substitutions: string[]) => {
      const templates: { [key: string]: string } = {
        importFailed: `インポートエラー: ${substitutions[0]}`,
      };
      return templates[key] || key;
    }),
  },
}));

// Mock DateFormatterService
jest.mock('@domain/services/DateFormatterService', () => ({
  DateFormatterService: jest.fn().mockImplementation(() => ({
    formatForFilename: jest.fn(() => '202511220143'),
  })),
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ExportImportManager', () => {
  let manager: ExportImportManager;
  let mockPresenter: jest.Mocked<XPathManagerPresenter>;
  let mockLogger: jest.Mocked<Logger>;
  let mockExportBtn: HTMLButtonElement;

  beforeEach(() => {
    // Setup mock presenter
    mockPresenter = {
      exportXPaths: jest.fn(),
      exportWebsites: jest.fn(),
      exportAutomationVariables: jest.fn(),
      importXPaths: jest.fn(),
      importWebsites: jest.fn(),
      importAutomationVariables: jest.fn(),
    } as any;

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Setup mock export button
    mockExportBtn = document.createElement('button');
    document.body.appendChild(mockExportBtn);

    // Set up export-menu-template for ExportImportManager
    const exportMenuTemplate = document.createElement('template');
    exportMenuTemplate.id = 'export-menu-template';
    exportMenuTemplate.innerHTML = `
      <div class="export-menu">
        <button id="exportXPathsBtn" class="menu-item" data-i18n="exportXPaths"></button>
        <button id="exportWebsitesBtn" class="menu-item" data-i18n="exportWebsites"></button>
        <button id="exportAutomationVariablesBtn" class="menu-item" data-i18n="exportAutomationVariables"></button>
      </div>
    `;
    document.body.appendChild(exportMenuTemplate);

    manager = new ExportImportManager(mockPresenter, mockLogger, mockExportBtn);

    // Mock alert
    global.alert = jest.fn();

    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock downloadCSV to prevent JSDOM navigation error
    jest.spyOn(ExportImportManager.prototype as any, 'downloadCSV').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    TemplateLoader.clearCache();
  });

  describe('showExportMenu', () => {
    it('should create and show export menu', () => {
      manager.showExportMenu();

      const menu = document.querySelector('.export-menu');
      expect(menu).not.toBeNull();
      expect(menu?.innerHTML).toContain('XPathsをエクスポート');
      expect(menu?.innerHTML).toContain('Websitesをエクスポート');
      expect(menu?.innerHTML).toContain('Automation Variablesをエクスポート');
    });

    it('should position menu below export button', () => {
      mockExportBtn.getBoundingClientRect = jest.fn(() => ({
        bottom: 100,
        left: 50,
        top: 80,
        right: 150,
        width: 100,
        height: 20,
        x: 50,
        y: 80,
        toJSON: () => ({}),
      }));

      manager.showExportMenu();

      const menu = document.querySelector('.export-menu') as HTMLElement;
      expect(menu).not.toBeNull();
    });

    it('should export XPaths when export button is clicked', async () => {
      const mockCSV = 'id,name,url\nxpath1,Test,https://example.com';
      mockPresenter.exportXPaths.mockResolvedValue(mockCSV);

      // Restore downloadCSV to test it
      jest.restoreAllMocks();
      const downloadCSVSpy = jest
        .spyOn(ExportImportManager.prototype as any, 'downloadCSV')
        .mockImplementation(() => {});

      manager.showExportMenu();

      const exportXPathsBtn = document.getElementById('exportXPathsBtn');
      exportXPathsBtn?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.exportXPaths).toHaveBeenCalled();
      expect(downloadCSVSpy).toHaveBeenCalledWith(mockCSV, 'xpaths_202511220143.csv');
    });

    it('should export Websites when export button is clicked', async () => {
      const mockCSV = 'id,name,url\nwebsite1,Test,https://example.com';
      mockPresenter.exportWebsites.mockResolvedValue(mockCSV);

      // Restore downloadCSV to test it
      jest.restoreAllMocks();
      const downloadCSVSpy = jest
        .spyOn(ExportImportManager.prototype as any, 'downloadCSV')
        .mockImplementation(() => {});

      manager.showExportMenu();

      const exportWebsitesBtn = document.getElementById('exportWebsitesBtn');
      exportWebsitesBtn?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.exportWebsites).toHaveBeenCalled();
      expect(downloadCSVSpy).toHaveBeenCalledWith(mockCSV, 'websites_202511220143.csv');
    });

    it('should export Automation Variables when export button is clicked', async () => {
      const mockCSV = 'websiteId,status,variables\nwebsite1,enabled,{}';
      mockPresenter.exportAutomationVariables.mockResolvedValue(mockCSV);

      // Restore downloadCSV to test it
      jest.restoreAllMocks();
      const downloadCSVSpy = jest
        .spyOn(ExportImportManager.prototype as any, 'downloadCSV')
        .mockImplementation(() => {});

      manager.showExportMenu();

      const exportAutomationVariablesBtn = document.getElementById('exportAutomationVariablesBtn');
      exportAutomationVariablesBtn?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.exportAutomationVariables).toHaveBeenCalled();
      expect(downloadCSVSpy).toHaveBeenCalledWith(mockCSV, 'automation_variables_202511220143.csv');
    });

    it('should close menu when clicking outside', async () => {
      manager.showExportMenu();

      const menu = document.querySelector('.export-menu') as HTMLElement;
      expect(menu).not.toBeNull();

      // Wait for setTimeout to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate click outside
      const outsideEvent = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(outsideEvent);

      expect(document.querySelector('.export-menu')).toBeNull();
    });
  });

  describe('exportXPaths', () => {
    it('should export XPaths and return CSV', async () => {
      const mockCSV = 'id,name,url\nxpath1,Test,https://example.com';
      mockPresenter.exportXPaths.mockResolvedValue(mockCSV);

      const result = await manager.exportXPaths();

      expect(mockPresenter.exportXPaths).toHaveBeenCalled();
      expect(result).toBe(mockCSV);
    });
  });

  describe('exportWebsites', () => {
    it('should export Websites and return CSV', async () => {
      const mockCSV = 'id,name,url\nwebsite1,Test,https://example.com';
      mockPresenter.exportWebsites.mockResolvedValue(mockCSV);

      const result = await manager.exportWebsites();

      expect(mockPresenter.exportWebsites).toHaveBeenCalled();
      expect(result).toBe(mockCSV);
    });
  });

  describe('exportAutomationVariables', () => {
    it('should export Automation Variables and return CSV', async () => {
      const mockCSV = 'websiteId,status,variables\nwebsite1,enabled,{}';
      mockPresenter.exportAutomationVariables.mockResolvedValue(mockCSV);

      const result = await manager.exportAutomationVariables();

      expect(mockPresenter.exportAutomationVariables).toHaveBeenCalled();
      expect(result).toBe(mockCSV);
    });
  });

  describe('importFile', () => {
    it('should import XPaths CSV file', async () => {
      const csvContent =
        'id,value,action_type,url,execution_order,selected_path_pattern\nxpath1,test,click,url,1,smart';
      const mockFile = new File([csvContent], 'xpaths.csv', { type: 'text/csv' }) as any;
      mockFile.text = jest.fn().mockResolvedValue(csvContent);

      const onWebsitesImported = jest.fn();
      const onXPathsImported = jest.fn();

      mockPresenter.importXPaths.mockResolvedValue();

      await manager.importFile(mockFile, onWebsitesImported, onXPathsImported);

      expect(mockLogger.info).toHaveBeenCalledWith('Importing XPaths CSV');
      expect(mockPresenter.importXPaths).toHaveBeenCalled();
      expect(onXPathsImported).toHaveBeenCalled();
    });

    it('should import Websites CSV file', async () => {
      const csvContent =
        'id,name,status,start_url,variables,updated_at,editable\nwebsite1,Test,enabled,url,{},date,true';
      const mockFile = new File([csvContent], 'websites.csv', { type: 'text/csv' }) as any;
      mockFile.text = jest.fn().mockResolvedValue(csvContent);

      const onWebsitesImported = jest.fn();
      const onXPathsImported = jest.fn();

      mockPresenter.importWebsites.mockResolvedValue();

      await manager.importFile(mockFile, onWebsitesImported, onXPathsImported);

      expect(mockLogger.info).toHaveBeenCalledWith('Importing Websites CSV');
      expect(mockPresenter.importWebsites).toHaveBeenCalled();
      expect(onWebsitesImported).toHaveBeenCalled();
    });

    it('should import Automation Variables CSV file', async () => {
      const csvContent =
        '"status","updatedAt","variables","websiteId"\n"enabled","date","{}","website1"';
      const mockFile = new File([csvContent], 'automation_variables.csv', {
        type: 'text/csv',
      }) as any;
      mockFile.text = jest.fn().mockResolvedValue(csvContent);

      const onWebsitesImported = jest.fn();
      const onXPathsImported = jest.fn();

      mockPresenter.importAutomationVariables.mockResolvedValue();

      await manager.importFile(mockFile, onWebsitesImported, onXPathsImported);

      expect(mockLogger.info).toHaveBeenCalledWith('Importing Automation Variables CSV');
      expect(mockPresenter.importAutomationVariables).toHaveBeenCalled();
      expect(onWebsitesImported).toHaveBeenCalled();
    });

    it('should throw error for unknown file format', async () => {
      const csvContent = 'unknown,format\ndata,data';
      const mockFile = new File([csvContent], 'unknown.csv', { type: 'text/csv' }) as any;
      mockFile.text = jest.fn().mockResolvedValue(csvContent);

      const onWebsitesImported = jest.fn();
      const onXPathsImported = jest.fn();

      await expect(
        manager.importFile(mockFile, onWebsitesImported, onXPathsImported)
      ).rejects.toThrow('Unknown file format');

      expect(mockLogger.error).toHaveBeenCalledWith('Import error', expect.any(Error));
      expect(global.alert).toHaveBeenCalled();
    });

    it('should handle import error', async () => {
      const csvContent =
        'id,value,action_type,url,execution_order,selected_path_pattern\nxpath1,test,click,url,1,smart';
      const mockFile = new File([csvContent], 'xpaths.csv', { type: 'text/csv' }) as any;
      mockFile.text = jest.fn().mockResolvedValue(csvContent);

      const onWebsitesImported = jest.fn();
      const onXPathsImported = jest.fn();

      mockPresenter.importXPaths.mockRejectedValue(new Error('Import failed'));

      await expect(
        manager.importFile(mockFile, onWebsitesImported, onXPathsImported)
      ).rejects.toThrow('Import failed');

      expect(mockLogger.error).toHaveBeenCalledWith('Import error', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('インポートエラー: Import failed');
    });
  });
});
