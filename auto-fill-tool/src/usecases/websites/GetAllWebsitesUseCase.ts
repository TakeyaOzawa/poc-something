import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { WebsiteMapper } from '@application/mappers/WebsiteMapper';
import { NoInputCommand } from '@domain/commands/Command';

/**
 * Output DTO for GetAllWebsites UseCase
 */
export interface GetAllWebsitesOutput {
  success: boolean;
  websites?: WebsiteOutputDto[];
  error?: string;
}

/**
 * Use Case: Get All Websites
 * Retrieves all registered websites from the repository
 */
export class GetAllWebsitesUseCase implements NoInputCommand<GetAllWebsitesOutput> {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(): Promise<GetAllWebsitesOutput> {
    const result = await this.websiteRepository.load();

    if (result.isFailure) {
      return {
        success: false,
        error: result.error?.message || 'Failed to load websites',
      };
    }

    const collection = result.value!;
    const websiteArray = collection.getAll();
    const websiteDataArray = websiteArray.map((w) => w.toData());
    const websiteDtos = WebsiteMapper.toOutputDtoArray(websiteDataArray);

    return {
      success: true,
      websites: websiteDtos,
    };
  }
}
