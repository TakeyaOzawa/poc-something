import { SaveWebsiteUseCase } from '../SaveWebsiteUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { Result } from '@domain/values/result.value';

describe('SaveWebsiteUseCase', () => {
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let useCase: SaveWebsiteUseCase;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
    };
    useCase = new SaveWebsiteUseCase(mockRepository);
  });

  it('should save a new website with minimal params', async () => {
    mockRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ name: 'New Website' });

    expect(output.success).toBe(true);
    expect(output.website?.name).toBe('New Website');
    expect(output.website?.editable).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should save a new website with all params', async () => {
    mockRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({
      name: 'Test Website',
      editable: false,
      startUrl: 'https://example.com',
    });

    expect(output.success).toBe(true);
    expect(output.website?.name).toBe('Test Website');
    expect(output.website?.editable).toBe(false);
    expect(output.website?.startUrl).toBe('https://example.com');
  });

  it('should add website to existing collection', async () => {
    const existingWebsite = Website.create({ name: 'Existing Website' });
    const collection = new WebsiteCollection([existingWebsite]);
    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const output = await useCase.execute({ name: 'New Website' });

    expect(output.success).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedCollection = mockRepository.save.mock.calls[0][0];
    expect(savedCollection.getAll()).toHaveLength(2);
  });

  it('should return failure when load fails', async () => {
    mockRepository.load.mockResolvedValue(Result.failure(new Error('Load failed')));

    const output = await useCase.execute({ name: 'New Website' });

    expect(output.success).toBe(false);
    expect(output.error).toBeDefined();
  });

  it('should return failure when save fails', async () => {
    mockRepository.load.mockResolvedValue(Result.success(WebsiteCollection.empty()));
    mockRepository.save.mockResolvedValue(Result.failure(new Error('Save failed')));

    const output = await useCase.execute({ name: 'New Website' });

    expect(output.success).toBe(false);
    expect(output.error).toBeDefined();
  });
});
