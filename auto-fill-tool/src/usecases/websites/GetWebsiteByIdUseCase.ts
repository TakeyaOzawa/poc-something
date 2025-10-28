import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteData } from '@domain/entities/Website';

/**
 * Input DTO for GetWebsiteById UseCase
 */
export interface GetWebsiteByIdInput {
  websiteId: string;
}

/**
 * Output DTO for GetWebsiteById UseCase
 */
export interface GetWebsiteByIdOutput {
  success: boolean;
  website?: WebsiteData | null;
  error?: string;
}

/**
 * Use Case: Get Website By ID
 * Retrieves a specific website by its ID
 */
export class GetWebsiteByIdUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(input: GetWebsiteByIdInput): Promise<GetWebsiteByIdOutput> {
    const result = await this.websiteRepository.load();

    if (result.isFailure) {
      return {
        success: false,
        error: result.error?.message || 'Failed to load websites',
      };
    }

    const collection = result.value!;
    const website = collection.getById(input.websiteId);
    return {
      success: true,
      website: website ? website.toData() : null,
    };
  }
}
