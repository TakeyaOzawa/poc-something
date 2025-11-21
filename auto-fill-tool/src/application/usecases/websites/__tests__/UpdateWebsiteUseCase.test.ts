import { UpdateWebsiteUseCase } from '../UpdateWebsiteUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website, WebsiteData } from '@domain/entities/Website';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('UpdateWebsiteUseCase', () => {
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let useCase: UpdateWebsiteUseCase;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
    };
    useCase = new UpdateWebsiteUseCase(mockRepository);
  });

  it(
    'should update an existing website',
    async () => {
      const website = Website.create({ name: 'Original Name' });
      const collection = new WebsiteCollection([website]);
      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const updatedData: WebsiteData = {
        ...website.toData(),
        name: 'Updated Name',
      };

      const output = await useCase.execute({ websiteData: updatedData }, mockIdGenerator);

      expect(output.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedCollection = mockRepository.save.mock.calls[0][0];
      expect(savedCollection.getById(website.getIdValue())?.getName()).toBe('Updated Name');
    },
    mockIdGenerator
  );

  it('should return failure if website not found', async () => {
    mockRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));

    const websiteData: WebsiteData = {
      id: 'nonexistent_id',
      name: 'Test',
      updatedAt: new Date().toISOString(),
      editable: true,
    };

    const output = await useCase.execute({ websiteData });

    expect(output.success).toBe(false);
    expect(output.error).toContain('Website not found');
  });

  it('should return failure when load fails', async () => {
    mockRepository.load.mockResolvedValue(Result.failure(new Error('Load failed')));

    const websiteData: WebsiteData = {
      id: 'any_id',
      name: 'Test',
      updatedAt: new Date().toISOString(),
      editable: true,
    };

    const output = await useCase.execute({ websiteData });

    expect(output.success).toBe(false);
    expect(output.error).toBeDefined();
  });

  it(
    'should return failure when save fails',
    async () => {
      const website = Website.create({ name: 'Original Name' });
      const collection = new WebsiteCollection([website]);
      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.save.mockResolvedValue(Result.failure(new Error('Save failed')));

      const updatedData: WebsiteData = {
        ...website.toData(),
        name: 'Updated Name',
      };

      const output = await useCase.execute({ websiteData: updatedData }, mockIdGenerator);

      expect(output.success).toBe(false);
      expect(output.error).toBeDefined();
    },
    mockIdGenerator
  );
});
