import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { Website, WebsiteData } from '@domain/entities/Website';

/**
 * Input DTO for SaveWebsite UseCase
 */
export interface SaveWebsiteInput {
  name: string;
  editable?: boolean;
  startUrl?: string;
}

/**
 * Output DTO for SaveWebsite UseCase
 */
export interface SaveWebsiteOutput {
  success: boolean;
  website?: WebsiteData;
  error?: string;
}

/**
 * Use Case: Save Website
 * Creates and saves a new website
 */
export class SaveWebsiteUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(input: SaveWebsiteInput): Promise<SaveWebsiteOutput> {
    // Load existing collection
    const loadResult = await this.websiteRepository.load();
    if (loadResult.isFailure) {
      return {
        success: false,
        error: loadResult.error?.message || 'Failed to load websites',
      };
    }

    const collection = loadResult.value!;
    const website = Website.create(input);
    const newCollection = collection.add(website);

    // Save updated collection
    const saveResult = await this.websiteRepository.save(newCollection);
    if (saveResult.isFailure) {
      return {
        success: false,
        error: saveResult.error?.message || 'Failed to save website',
      };
    }

    return {
      success: true,
      website: website.toData(),
    };
  }
}
