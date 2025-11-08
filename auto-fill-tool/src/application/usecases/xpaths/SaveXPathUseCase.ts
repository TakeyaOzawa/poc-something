/**
 * Use Case: Save XPath to collection
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { PathPattern, ActionType } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { RetryType } from '@domain/constants/RetryType';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { XPathMapper } from '@application/mappers/XPathMapper';

/**
 * Input DTO for SaveXPathUseCase
 */
export interface SaveXPathInput {
  websiteId?: string;
  value: string;
  actionType?: ActionType;
  afterWaitSeconds?: number;
  actionPattern?: number;
  pathAbsolute: string;
  pathShort: string;
  pathSmart: string;
  selectedPathPattern?: PathPattern;
  retryType?: RetryType;
  executionOrder?: number;
  executionTimeoutSeconds?: number;
  url: string;
}

/**
 * Output DTO for SaveXPathUseCase
 */
export interface SaveXPathOutput {
  xpath: XPathOutputDto;
}

export class SaveXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  // eslint-disable-next-line complexity -- Handles multiple optional input parameters with default value assignment using null coalescing operators (??) and ternary operators. Complexity of 11 is due to: Result type error handling (load + isFailure, save + isFailure), and 8 optional parameter default assignments (websiteId, actionType, afterWaitSeconds, actionPattern, selectedPathPattern, retryType, executionOrder, executionTimeoutSeconds). The default value logic is necessary for flexible UseCase input handling and cannot be reduced without losing input validation or requiring all parameters to be mandatory.
  async execute(input: SaveXPathInput): Promise<SaveXPathOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error!;
    }
    const collection = collectionResult.value!;

    // Get next execution order from domain entity
    const websiteId = input.websiteId || '';
    const nextExecutionOrder = collection.getNextExecutionOrder(websiteId);

    const updatedCollection = collection.add({
      websiteId: websiteId,
      value: input.value,
      actionType: input.actionType || ACTION_TYPE.TYPE,
      afterWaitSeconds: input.afterWaitSeconds ?? 0,
      actionPattern: input.actionPattern ?? 0,
      pathAbsolute: input.pathAbsolute,
      pathShort: input.pathShort,
      pathSmart: input.pathSmart,
      selectedPathPattern:
        input.selectedPathPattern !== undefined ? input.selectedPathPattern : 'smart',
      retryType: (input.retryType ?? 0) as RetryType,
      executionOrder: input.executionOrder ?? nextExecutionOrder,
      executionTimeoutSeconds: input.executionTimeoutSeconds ?? 30,
      url: input.url,
    });
    const saveResult = await this.xpathRepository.save(updatedCollection);
    if (saveResult.isFailure) {
      throw saveResult.error || new Error('Repository save failed');
    }

    // Get the newly added XPath (it should be the last one with the same websiteId)
    const allXPaths = updatedCollection.getByWebsiteId(websiteId);
    if (allXPaths.length === 0) {
      throw new Error('Failed to retrieve the newly added XPath');
    }
    const newXPath = allXPaths[allXPaths.length - 1];
    if (!newXPath) {
      throw new Error('Failed to retrieve the newly added XPath');
    }

    // DTOパターン: XPathDataをOutputDTOに変換
    const xpathDto = XPathMapper.toOutputDto(newXPath);
    return { xpath: xpathDto };
  }
}
