import { UpdateWebsiteStatusUseCase } from '../UpdateWebsiteStatusUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { Result } from '@domain/values/result.value';

describe('UpdateWebsiteStatusUseCase', () => {
  let mockWebsiteRepository: jest.Mocked<WebsiteRepository>;
  let mockAutomationVariablesRepository: jest.Mocked<AutomationVariablesRepository>;
  let useCase: UpdateWebsiteStatusUseCase;

  beforeEach(() => {
    mockWebsiteRepository = {
      save: jest.fn(),
      load: jest.fn(),
    };
    mockAutomationVariablesRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    };
    useCase = new UpdateWebsiteStatusUseCase(
      mockWebsiteRepository,
      mockAutomationVariablesRepository
    );
  });

  it('should update website status', async () => {
    const website = Website.create({ name: 'Test Website' });
    const collection = new WebsiteCollection([website]);
    mockWebsiteRepository.load.mockResolvedValue(Result.success(collection));
    mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
    mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ websiteId: website.getId(), status: 'disabled' });

    expect(output.success).toBe(true);
    expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
    const savedVariables = mockAutomationVariablesRepository.save.mock.calls[0][0];
    expect(savedVariables.getStatus()).toBe('disabled');
    expect(savedVariables.getWebsiteId()).toBe(website.getId());
  });

  it('should return failure if website not found', async () => {
    mockWebsiteRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));

    const output = await useCase.execute({ websiteId: 'nonexistent_id', status: 'disabled' });

    expect(output.success).toBe(false);
    expect(output.error).toContain('Website not found: nonexistent_id');
  });

  it('should handle all status types', async () => {
    const website = Website.create({ name: 'Test Website' });
    const collection = new WebsiteCollection([website]);
    mockWebsiteRepository.load.mockResolvedValue(Result.success(collection));
    mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
    mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

    const output1 = await useCase.execute({ websiteId: website.getId(), status: 'enabled' });
    const output2 = await useCase.execute({ websiteId: website.getId(), status: 'disabled' });
    const output3 = await useCase.execute({ websiteId: website.getId(), status: 'once' });

    expect(output1.success).toBe(true);
    expect(output2.success).toBe(true);
    expect(output3.success).toBe(true);
    expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(3);
  });

  it('should update existing automation variables', async () => {
    const website = Website.create({ name: 'Test Website' });
    const collection = new WebsiteCollection([website]);
    const existingVariables = AutomationVariables.create({
      websiteId: website.getId(),
      status: 'enabled',
      variables: { key: 'value' },
    });

    mockWebsiteRepository.load.mockResolvedValue(Result.success(collection));
    mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(existingVariables));
    mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ websiteId: website.getId(), status: 'disabled' });

    expect(output.success).toBe(true);
    expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
    const savedVariables = mockAutomationVariablesRepository.save.mock.calls[0][0];
    expect(savedVariables.getStatus()).toBe('disabled');
    expect(savedVariables.getVariables()).toEqual({ key: 'value' }); // variables preserved
  });
});
