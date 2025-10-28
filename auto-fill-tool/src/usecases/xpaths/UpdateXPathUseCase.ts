/**
 * Use Case: Update existing XPath
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathData, PathPattern, ActionType } from '@domain/entities/XPathCollection';
import { RetryType } from '@domain/constants/RetryType';

/**
 * Input DTO for UpdateXPathUseCase
 */
export interface UpdateXPathInput {
  id: string;
  websiteId?: string;
  value?: string;
  actionType?: ActionType;
  afterWaitSeconds?: number;
  dispatchEventPattern?: number;
  pathAbsolute?: string;
  pathShort?: string;
  pathSmart?: string;
  selectedPathPattern?: PathPattern;
  retryType?: RetryType;
  executionOrder?: number;
  executionTimeoutSeconds?: number;
  url?: string;
}

/**
 * Output DTO for UpdateXPathUseCase
 */
export interface UpdateXPathOutput {
  xpath: XPathData | null;
}

export class UpdateXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(input: UpdateXPathInput): Promise<UpdateXPathOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error!;
    }
    const collection = collectionResult.value!;

    // Filter out empty websiteId to prevent overwriting with empty string
    const updateData = { ...input };
    if (updateData.websiteId === '') {
      delete updateData.websiteId;
    }

    try {
      const updatedCollection = collection.update(input.id, updateData);
      const saveResult = await this.xpathRepository.save(updatedCollection);
      if (saveResult.isFailure) {
        throw saveResult.error!;
      }
      return { xpath: updatedCollection.get(input.id) ?? null };
    } catch (error) {
      // XPath not found
      return { xpath: null };
    }
  }
}
