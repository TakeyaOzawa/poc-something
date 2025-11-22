/**
 * Use Case: Update existing XPath
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { PathPattern, ActionType } from '@domain/entities/XPathCollection';
import { RetryType } from '@domain/constants/RetryType';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { XPathMapper } from '@application/mappers/XPathMapper';

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
  xpath: XPathOutputDto | null;
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

    const updateResult = collection.update(input.id, updateData);
    if (updateResult.isFailure) {
      // XPath not found
      return { xpath: null };
    }

    const updatedCollection = updateResult.value!;

    const saveResult = await this.xpathRepository.save(updatedCollection);
    if (saveResult.isFailure) {
      throw saveResult.error!;
    }

    const updatedXPath = updatedCollection.get(input.id);
    if (!updatedXPath) {
      return { xpath: null };
    }

    // DTOパターン: XPathDataをOutputDTOに変換
    const xpathDto = XPathMapper.toOutputDto(updatedXPath);
    return { xpath: xpathDto };
  }
}
