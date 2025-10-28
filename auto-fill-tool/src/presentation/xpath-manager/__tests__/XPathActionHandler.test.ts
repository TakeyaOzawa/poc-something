/**
 * Unit Tests: XPathActionHandler
 */

import { XPathActionHandler } from '../XPathActionHandler';
import { XPathManagerPresenter } from '../XPathManagerPresenter';
import { XPathEditModalManager } from '../XPathEditModalManager';
import { Logger } from '@domain/types/logger.types';

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
        confirmDeleteXPath: 'このXPathを削除しますか?',
      };
      return messages[key] || key;
    }),
  },
}));

describe('XPathActionHandler', () => {
  let handler: XPathActionHandler;
  let mockPresenter: jest.Mocked<XPathManagerPresenter>;
  let mockEditModalManager: jest.Mocked<XPathEditModalManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockXPathList: HTMLDivElement;
  let mockOnXPathsChanged: jest.Mock;

  beforeEach(() => {
    // Setup mock DOM
    mockXPathList = document.createElement('div');
    mockXPathList.innerHTML = `
      <button data-action="duplicate" data-id="xpath_1">Duplicate</button>
      <button data-action="edit" data-id="xpath_2">Edit</button>
      <button data-action="delete" data-id="xpath_3">Delete</button>
      <button data-action="unknown" data-id="xpath_4">Unknown</button>
      <button data-action="duplicate">No ID</button>
    `;

    // Setup mock presenter
    mockPresenter = {
      deleteXPath: jest.fn(),
      duplicateXPath: jest.fn(),
    } as any;

    // Setup mock edit modal manager
    mockEditModalManager = {
      openEditModal: jest.fn(),
    } as any;

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Setup mock callback
    mockOnXPathsChanged = jest.fn();

    handler = new XPathActionHandler(
      mockPresenter,
      mockEditModalManager,
      mockLogger,
      mockXPathList,
      mockOnXPathsChanged
    );

    // Mock confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('attachActionListeners', () => {
    it('should attach event listeners to action buttons', () => {
      handler.attachActionListeners();

      expect(mockLogger.debug).toHaveBeenCalledWith('Total buttons found:', {
        buttonsLength: 5,
      });
    });

    it('should handle duplicate action', async () => {
      mockPresenter.duplicateXPath.mockResolvedValue();
      mockOnXPathsChanged.mockResolvedValue(undefined);

      handler.attachActionListeners();

      const duplicateBtn = mockXPathList.querySelector(
        '[data-action="duplicate"][data-id="xpath_1"]'
      ) as HTMLElement;
      duplicateBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.debug).toHaveBeenCalledWith('Calling handleDuplicateXPath');
      expect(mockPresenter.duplicateXPath).toHaveBeenCalledWith('xpath_1');
      expect(mockOnXPathsChanged).toHaveBeenCalled();
    });

    it('should handle edit action', async () => {
      mockEditModalManager.openEditModal.mockResolvedValue();

      handler.attachActionListeners();

      const editBtn = mockXPathList.querySelector('[data-action="edit"]') as HTMLElement;
      editBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.debug).toHaveBeenCalledWith('Calling handleEditXPath');
      expect(mockEditModalManager.openEditModal).toHaveBeenCalledWith('xpath_2');
    });

    it('should handle delete action', async () => {
      mockPresenter.deleteXPath.mockResolvedValue();
      mockOnXPathsChanged.mockResolvedValue(undefined);

      handler.attachActionListeners();

      const deleteBtn = mockXPathList.querySelector('[data-action="delete"]') as HTMLElement;
      deleteBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.confirm).toHaveBeenCalledWith('このXPathを削除しますか?');
      expect(mockLogger.debug).toHaveBeenCalledWith('Calling handleDeleteXPath');
      expect(mockPresenter.deleteXPath).toHaveBeenCalledWith('xpath_3');
      expect(mockOnXPathsChanged).toHaveBeenCalled();
    });

    it('should not delete if user cancels confirm', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      handler.attachActionListeners();

      const deleteBtn = mockXPathList.querySelector('[data-action="delete"]') as HTMLElement;
      deleteBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.deleteXPath).not.toHaveBeenCalled();
    });

    it('should handle unknown action', async () => {
      handler.attachActionListeners();

      const unknownBtn = mockXPathList.querySelector('[data-action="unknown"]') as HTMLElement;
      unknownBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.error).toHaveBeenCalledWith('Unknown action', { action: 'unknown' });
    });

    it('should handle button without ID', async () => {
      handler.attachActionListeners();

      const noIdBtn = mockXPathList.querySelector(
        '[data-action="duplicate"]:not([data-id])'
      ) as HTMLElement;
      noIdBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.error).toHaveBeenCalledWith('No ID found');
    });

    it('should handle duplicate error', async () => {
      mockPresenter.duplicateXPath.mockRejectedValue(new Error('Duplicate failed'));

      handler.attachActionListeners();

      const duplicateBtn = mockXPathList.querySelector(
        '[data-action="duplicate"][data-id="xpath_1"]'
      ) as HTMLElement;
      duplicateBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.duplicateXPath).toHaveBeenCalledWith('xpath_1');
      expect(mockOnXPathsChanged).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      mockPresenter.deleteXPath.mockRejectedValue(new Error('Delete failed'));

      handler.attachActionListeners();

      const deleteBtn = mockXPathList.querySelector('[data-action="delete"]') as HTMLElement;
      deleteBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.deleteXPath).toHaveBeenCalledWith('xpath_3');
      expect(mockOnXPathsChanged).not.toHaveBeenCalled();
    });
  });
});
