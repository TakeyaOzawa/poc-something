import { DeleteWebsiteUseCase } from '../DeleteWebsiteUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { Website } from '@domain/entities/Website';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { Result } from '@domain/values/result.value';

describe('DeleteWebsiteUseCase', () => {
  let mockWebsiteRepository: jest.Mocked<WebsiteRepository>;
  let mockXPathRepository: jest.Mocked<XPathRepository>;
  let mockAutomationVariablesRepository: jest.Mocked<AutomationVariablesRepository>;
  let useCase: DeleteWebsiteUseCase;

  beforeEach(() => {
    mockWebsiteRepository = {
      save: jest.fn(),
      load: jest.fn(),
    };
    mockXPathRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    mockAutomationVariablesRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    useCase = new DeleteWebsiteUseCase(
      mockWebsiteRepository,
      mockXPathRepository,
      mockAutomationVariablesRepository
    );
  });

  it('should delete website and associated xpaths', async () => {
    const website = Website.create({ name: 'Test Website' });
    const websiteCollection = new WebsiteCollection([website]);

    const xpath1: XPathData = {
      id: 'xpath_001',
      value: 'test',
      actionType: ACTION_TYPE.TYPE,
      url: 'https://example.com',
      websiteId: website.getId(),
      executionOrder: 1,
      selectedPathPattern: '',
      pathShort: '',
      pathAbsolute: '',
      pathSmart: '',
      actionPattern: 0,
      afterWaitSeconds: 0,
      executionTimeoutSeconds: 30,
      retryType: 0,
    };

    const xpath2: XPathData = {
      ...xpath1,
      id: 'xpath_002',
      websiteId: 'other_website',
    };

    const xpathCollection = new XPathCollection([xpath1, xpath2]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    mockXPathRepository.load.mockResolvedValue(Result.success(xpathCollection));
    mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
    mockXPathRepository.save.mockResolvedValue(Result.success(undefined));
    mockAutomationVariablesRepository.delete.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ websiteId: website.getId() });

    expect(output.success).toBe(true);
    expect(mockWebsiteRepository.save).toHaveBeenCalledTimes(1);
    expect(mockXPathRepository.save).toHaveBeenCalledTimes(1);
    expect(mockAutomationVariablesRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockAutomationVariablesRepository.delete).toHaveBeenCalledWith(website.getId());

    const savedWebsiteCollection = mockWebsiteRepository.save.mock.calls[0][0];
    expect(savedWebsiteCollection.getAll()).toHaveLength(0);

    const savedXPathCollection = mockXPathRepository.save.mock.calls[0][0];
    expect(savedXPathCollection.getAll()).toHaveLength(1);
    expect(savedXPathCollection.getAll()[0].id).toBe('xpath_002');
  });

  it('should only delete the specified website', async () => {
    const website1 = Website.create({ name: 'Website 1' });
    const website2 = Website.create({ name: 'Website 2' });
    const websiteCollection = new WebsiteCollection([website1, website2]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    mockXPathRepository.load.mockResolvedValue(Result.success(XPathCollection.empty()));
    mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
    mockXPathRepository.save.mockResolvedValue(Result.success(undefined));
    mockAutomationVariablesRepository.delete.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ websiteId: website1.getId() });

    expect(output.success).toBe(true);
    const savedCollection = mockWebsiteRepository.save.mock.calls[0][0];
    expect(savedCollection.getAll()).toHaveLength(1);
    expect(savedCollection.getAll()[0].getId()).toBe(website2.getId());
    expect(mockAutomationVariablesRepository.delete).toHaveBeenCalledWith(website1.getId());
  });

  it('should delete automation variables even when no xpaths exist', async () => {
    const website = Website.create({ name: 'Test Website' });
    const websiteCollection = new WebsiteCollection([website]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    mockXPathRepository.load.mockResolvedValue(Result.success(XPathCollection.empty()));
    mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
    mockXPathRepository.save.mockResolvedValue(Result.success(undefined));
    mockAutomationVariablesRepository.delete.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ websiteId: website.getId() });

    expect(output.success).toBe(true);
    expect(mockAutomationVariablesRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockAutomationVariablesRepository.delete).toHaveBeenCalledWith(website.getId());
  });

  it('should throw error when automation variables deletion fails', async () => {
    const website = Website.create({ name: 'Test Website' });
    const websiteCollection = new WebsiteCollection([website]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    mockXPathRepository.load.mockResolvedValue(Result.success(XPathCollection.empty()));
    mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
    mockXPathRepository.save.mockResolvedValue(Result.success(undefined));

    const error = new Error('Failed to delete automation variables');
    mockAutomationVariablesRepository.delete.mockRejectedValue(error);

    await expect(useCase.execute({ websiteId: website.getId() })).rejects.toThrow(
      'Failed to delete automation variables'
    );
  });

  it('should return failure when website repository load fails', async () => {
    const error = new Error('Failed to load websites');
    mockWebsiteRepository.load.mockResolvedValue(Result.failure(error));

    const output = await useCase.execute({ websiteId: 'test-website-id' });

    expect(output.success).toBe(false);
    expect(output.error).toBe('Failed to load websites');
    expect(mockWebsiteRepository.save).not.toHaveBeenCalled();
    expect(mockXPathRepository.load).not.toHaveBeenCalled();
    expect(mockAutomationVariablesRepository.delete).not.toHaveBeenCalled();
  });

  it('should return failure when website repository save fails', async () => {
    const website = Website.create({ name: 'Test Website' });
    const websiteCollection = new WebsiteCollection([website]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    const error = new Error('Failed to delete website');
    mockWebsiteRepository.save.mockResolvedValue(Result.failure(error));

    const output = await useCase.execute({ websiteId: website.getId() });

    expect(output.success).toBe(false);
    expect(output.error).toBe('Failed to delete website');
    expect(mockXPathRepository.load).not.toHaveBeenCalled();
    expect(mockAutomationVariablesRepository.delete).not.toHaveBeenCalled();
  });

  it('should return failure when xpath repository load fails', async () => {
    const website = Website.create({ name: 'Test Website' });
    const websiteCollection = new WebsiteCollection([website]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
    const error = new Error('Failed to load xpaths');
    mockXPathRepository.load.mockResolvedValue(Result.failure(error));

    const output = await useCase.execute({ websiteId: website.getId() });

    expect(output.success).toBe(false);
    expect(output.error).toBe('Failed to load xpaths');
    expect(mockXPathRepository.save).not.toHaveBeenCalled();
    expect(mockAutomationVariablesRepository.delete).not.toHaveBeenCalled();
  });

  it('should return failure when xpath repository save fails', async () => {
    const website = Website.create({ name: 'Test Website' });
    const websiteCollection = new WebsiteCollection([website]);

    mockWebsiteRepository.load.mockResolvedValue(Result.success(websiteCollection));
    mockWebsiteRepository.save.mockResolvedValue(Result.success(undefined));
    mockXPathRepository.load.mockResolvedValue(Result.success(XPathCollection.empty()));
    const error = new Error('Failed to save xpaths');
    mockXPathRepository.save.mockResolvedValue(Result.failure(error));

    const output = await useCase.execute({ websiteId: website.getId() });

    expect(output.success).toBe(false);
    expect(output.error).toBe('Failed to save xpaths');
    expect(mockAutomationVariablesRepository.delete).not.toHaveBeenCalled();
  });
});
