/**
 * Use Case: Get all saved XPaths
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathData } from '@domain/entities/XPathCollection';

/**
 * Output DTO for GetAllXPathsUseCase
 */
export interface GetAllXPathsOutput {
  xpaths: XPathData[];
}

export class GetAllXPathsUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(): Promise<GetAllXPathsOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error;
    }
    return { xpaths: collectionResult.value!.getAll() };
  }
}
