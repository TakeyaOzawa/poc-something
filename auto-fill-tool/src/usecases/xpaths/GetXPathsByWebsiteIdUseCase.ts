/**
 * Use Case: Get XPaths by Website ID
 * Filters XPaths by website ID
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathData } from '@domain/entities/XPathCollection';

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
  xpaths: XPathData[];
}

export class GetXPathsByWebsiteIdUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(input: GetXPathsByWebsiteIdInput): Promise<GetXPathsByWebsiteIdOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error;
    }
    const allXpaths = collectionResult.value!.getAll();
    return { xpaths: allXpaths.filter((xpath) => xpath.websiteId === input.websiteId) };
  }
}
