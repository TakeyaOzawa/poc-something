import { GetWebsiteByIdUseCase } from '../GetWebsiteByIdUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetWebsiteByIdUseCase', () => {
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let useCase: GetWebsiteByIdUseCase;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
    };
    useCase = new GetWebsiteByIdUseCase(mockRepository);
  });

  it(
    'should return website by id',
    async () => {
      const website = Website.create({ name: 'Test Website' });
      const collection = new WebsiteCollection([website]);

      mockRepository.load.mockResolvedValue(Result.success(collection));

      const output = await useCase.execute({ websiteId: website.getId() }, mockIdGenerator);

      expect(output.success).toBe(true);
      expect(output.website).not.toBeNull();
      expect(output.website?.name).toBe('Test Website');
      expect(output.website?.id).toBe(website.getId());
    },
    mockIdGenerator
  );

  it('should return null if website not found', async () => {
    mockRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));

    const output = await useCase.execute({ websiteId: 'nonexistent_id' });

    expect(output.success).toBe(true);
    expect(output.website).toBeNull();
  });

  it('should return failure when repository fails', async () => {
    mockRepository.load.mockResolvedValue(Result.failure(new Error('Load failed')));

    const output = await useCase.execute({ websiteId: 'any_id' });

    expect(output.success).toBe(false);
    expect(output.error).toBeDefined();
  });
});
