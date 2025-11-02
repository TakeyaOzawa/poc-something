/**
 * Use Case: Get all saved XPaths
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { XPathMapper } from '@application/mappers/XPathMapper';

/**
 * Output DTO for GetAllXPathsUseCase
 */
export interface GetAllXPathsOutput {
  xpaths: XPathOutputDto[];
}

export class GetAllXPathsUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(): Promise<GetAllXPathsOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error;
    }

    const xpathDataArray = collectionResult.value!.getAll();
    const xpathDtos = XPathMapper.toOutputDtoArray(xpathDataArray);

    return { xpaths: xpathDtos };
  }
}
