import { GetAllWebsitesUseCase } from '../GetAllWebsitesUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetAllWebsitesUseCase', () => {
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let useCase: GetAllWebsitesUseCase;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
    };
    useCase = new GetAllWebsitesUseCase(mockRepository);
  });

  it(
    'should return all websites',
    async () => {
      const website1 = Website.create({ name: 'Website 1' });
      const website2 = Website.create({ name: 'Website 2' }, mockIdGenerator);
      const collection = new WebsiteCollection([website1, website2]);

      mockRepository.load.mockResolvedValue(Result.success(collection));

      const output = await useCase.execute();

      expect(output.success).toBe(true);
      expect(output.websites).toHaveLength(2);
      expect(output.websites![0].name).toBe('Website 1');
      expect(output.websites![1].name).toBe('Website 2');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
    },
    mockIdGenerator
  );

  it('should return empty array if no websites', async () => {
    mockRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));

    const output = await useCase.execute();

    expect(output.success).toBe(true);
    expect(output.websites).toEqual([]);
  });

  it('should return failure when repository fails', async () => {
    mockRepository.load.mockResolvedValue(Result.failure(new Error('Load failed')));

    const output = await useCase.execute();

    expect(output.success).toBe(false);
    expect(output.error).toBeDefined();
  });
});
