import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { WebsiteMapper } from '@application/mappers/WebsiteMapper';

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
  website?: WebsiteOutputDto | null;
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

    if (!website) {
      return {
        success: true,
        website: null,
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
