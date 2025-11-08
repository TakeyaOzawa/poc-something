/**
 * Use Case: Get XPaths by Website ID
 * Filters XPaths by website ID
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { XPathMapper } from '@application/mappers/XPathMapper';

/**
 * Input DTO for GetXPathsByWebsiteIdUseCase
 */
export interface GetXPathsByWebsiteIdInput {
  websiteId: string;
}

/**
 * Output DTO for GetXPathsByWebsiteIdUseCase
 */
export interface GetXPathsByWebsiteIdOutput {
  xpaths: XPathOutputDto[];
}

export class GetXPathsByWebsiteIdUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(input: GetXPathsByWebsiteIdInput): Promise<GetXPathsByWebsiteIdOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error;
    }

    const allXpaths = collectionResult.value!.getAll();
    const filteredXpaths = allXpaths.filter((xpath) => xpath.websiteId === input.websiteId);
    const xpathDtos = XPathMapper.toOutputDtoArray(filteredXpaths);

    return { xpaths: xpathDtos };
  }
}
