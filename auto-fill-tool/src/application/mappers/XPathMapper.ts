/**
 * XPath Mapper
 * ドメインエンティティ → OutputDTO の変換
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
      shortXPath: xpathData.pathShort,
      absoluteXPath: xpathData.pathAbsolute,
      smartXPath: xpathData.pathSmart,
      selectedPathPattern: xpathData.selectedPathPattern,
      afterWaitSeconds: xpathData.afterWaitSeconds,
      executionTimeoutSeconds: xpathData.executionTimeoutSeconds,
      retryType: xpathData.retryType,
      actionPattern: xpathData.actionPattern?.toString() || '',
    };
  }

  static toOutputDtoArray(xpathDataArray: XPathData[]): XPathOutputDto[] {
    return xpathDataArray.map((data) => this.toOutputDto(data));
  }
}
