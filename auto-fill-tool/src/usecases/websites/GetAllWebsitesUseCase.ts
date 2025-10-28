import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteData } from '@domain/entities/Website';

/**
 * Output DTO for GetAllWebsites UseCase
 */
export interface GetAllWebsitesOutput {
  success: boolean;
  websites?: WebsiteData[];
  error?: string;
}

/**
 * Use Case: Get All Websites
 * Retrieves all registered websites from the repository
 */
export class GetAllWebsitesUseCase {
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
    return {
      success: true,
      websites: collection.getAll().map((w) => w.toData()),
    };
  }
}
