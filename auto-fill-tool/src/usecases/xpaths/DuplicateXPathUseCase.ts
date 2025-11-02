/**
 * Use Case: Duplicate an existing XPath
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathData } from '@domain/entities/XPathCollection';

/**
 * Input DTO for DuplicateXPathUseCase
 */
export interface DuplicateXPathInput {
  id: string;
}

/**
 * Output DTO for DuplicateXPathUseCase
 */
export interface DuplicateXPathOutput {
  xpath: XPathData | null;
}

export class DuplicateXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(input: DuplicateXPathInput): Promise<DuplicateXPathOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error!;
    }
    const collection = collectionResult.value!;
    const original = collection.get(input.id);

    if (!original) {
      return { xpath: null };
    }

    // Get max execution order for the same websiteId to add duplicate at the end
    const sameWebsiteXPaths = collection.getByWebsiteId(original.websiteId);
    const maxOrder =
      sameWebsiteXPaths.length > 0
        ? Math.max(...sameWebsiteXPaths.map((x) => x.executionOrder))
        : 0;

    // Create duplicate with "_copy" suffix and new execution order
    const updatedCollection = collection.add({
      websiteId: original.websiteId,
      value: `${original.value}_copy`,
      actionType: original.actionType,
      afterWaitSeconds: original.afterWaitSeconds,
      actionPattern: original.actionPattern,
      pathAbsolute: original.pathAbsolute,
      pathShort: original.pathShort,
      pathSmart: original.pathSmart,
      selectedPathPattern: original.selectedPathPattern,
      retryType: original.retryType,
      executionOrder: maxOrder + 100, // Add 100 to place it at the end
      executionTimeoutSeconds: original.executionTimeoutSeconds,
      url: original.url,
    });

    const saveResult = await this.xpathRepository.save(updatedCollection);
    if (saveResult.isFailure) {
      throw saveResult.error!;
    }

    // Get the newly duplicated XPath (it should be the last one with the same websiteId)
    const allXPaths = updatedCollection.getByWebsiteId(original.websiteId);
    return { xpath: allXPaths[allXPaths.length - 1] || null };
  }
}
