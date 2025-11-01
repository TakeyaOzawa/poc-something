import { GetWebsitesUseCase, WebsiteRepository } from '../GetWebsitesUseCase';
import { WebsiteData } from '../domain/entities/Website';

describe('GetWebsitesUseCase', () => {
  let mockRepository: jest.Mocked<WebsiteRepository>;
  let useCase: GetWebsitesUseCase;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn()
    };
    useCase = new GetWebsitesUseCase(mockRepository);
  });

  it('should return websites from repository', async () => {
    const mockWebsiteData: WebsiteData[] = [
      {
        id: 'website-1',
        name: 'Test Website',
        startUrl: 'https://example.com',
        status: 'enabled'
      }
    ];

    mockRepository.findAll.mockResolvedValue(mockWebsiteData);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].getId()).toBe('website-1');
    expect(result[0].getName()).toBe('Test Website');
    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no websites exist', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toHaveLength(0);
    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
