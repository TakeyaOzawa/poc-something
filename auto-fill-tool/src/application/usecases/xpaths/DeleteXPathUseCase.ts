/**
 * Use Case: Delete XPath from collection
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';

/**
 * Input DTO for DeleteXPathUseCase
 */
export interface DeleteXPathInput {
  id: string;
}

/**
 * Output DTO for DeleteXPathUseCase
 */
export interface DeleteXPathOutput {
  deleted: boolean;
}

export class DeleteXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(input: DeleteXPathInput): Promise<DeleteXPathOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error!;
    }
    const collection = collectionResult.value!;
    const exists = collection.get(input.id) !== undefined;

    if (exists) {
      const newCollection = collection.delete(input.id);
      const saveResult = await this.xpathRepository.save(newCollection);
      if (saveResult.isFailure) {
        throw saveResult.error!;
      }
    }

    return { deleted: exists };
  }
}
