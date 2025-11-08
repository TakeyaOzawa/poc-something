import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { Website } from '@domain/entities/Website';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { WebsiteMapper } from '@application/mappers/WebsiteMapper';
import { Command } from '@domain/commands/Command';

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
  website?: WebsiteOutputDto;
  error?: string;
}

/**
 * Use Case: Save Website
 * Creates and saves a new website
 */
export class SaveWebsiteUseCase implements Command<SaveWebsiteInput, SaveWebsiteOutput> {
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

    // DTOパターン: WebsiteエンティティをOutputDTOに変換
    const websiteDto = WebsiteMapper.toOutputDto(website.toData());
    return {
      success: true,
      website: websiteDto,
    };
  }
}
