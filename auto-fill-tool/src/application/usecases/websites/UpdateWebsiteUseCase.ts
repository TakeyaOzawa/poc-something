import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { Website, WebsiteData } from '@domain/entities/Website';

/**
 * Input DTO for UpdateWebsite UseCase
 */
export interface UpdateWebsiteInput {
  websiteData: WebsiteData;
}

/**
 * Output DTO for UpdateWebsite UseCase
 */
export interface UpdateWebsiteOutput {
  success: boolean;
  error?: string;
}

/**
 * Use Case: Update Website
 * Updates an existing website's information
 */
export class UpdateWebsiteUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(input: UpdateWebsiteInput): Promise<UpdateWebsiteOutput> {
    const loadResult = await this.websiteRepository.load();
    if (loadResult.isFailure) {
      return {
        success: false,
        error: loadResult.error?.message || 'Failed to load websites',
      };
    }

    const collection = loadResult.value!;
    const website = new Website(input.websiteData);

    try {
      const newCollection = collection.update(input.websiteData.id, website);

      const saveResult = await this.websiteRepository.save(newCollection);
      if (saveResult.isFailure) {
        return {
          success: false,
          error: saveResult.error?.message || 'Failed to save website',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update website',
      };
    }
  }
}
