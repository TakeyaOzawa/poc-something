/**
 * Application Layer: XPath Mapper
 * Maps domain entities to DTOs
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { XPathOutputDto } from '../dtos/XPathOutputDto';

export class XPathMapper {
  static toOutputDto(xpathData: XPathData): XPathOutputDto {
    return {
      id: xpathData.id,
      websiteId: xpathData.websiteId,
      value: xpathData.value,
      actionType: xpathData.actionType,
      url: xpathData.url,
      executionOrder: xpathData.executionOrder,
      pathShort: xpathData.pathShort,
      pathAbsolute: xpathData.pathAbsolute,
      pathSmart: xpathData.pathSmart,
      selectedPathPattern: xpathData.selectedPathPattern,
      afterWaitSeconds: xpathData.afterWaitSeconds,
      executionTimeoutSeconds: xpathData.executionTimeoutSeconds,
      retryType: xpathData.retryType,
      actionPattern:
        typeof xpathData.actionPattern === 'string'
          ? xpathData.actionPattern
          : String(xpathData.actionPattern || ''),
    };
  }

  static toOutputDtoArray(xpathDataArray: XPathData[]): XPathOutputDto[] {
    return xpathDataArray.map((xpathData) => this.toOutputDto(xpathData));
  }
}
