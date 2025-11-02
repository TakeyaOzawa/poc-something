/**
 * XPath Mapper
 * ドメインエンティティ → OutputDTO の変換
 */
import { XPathData } from '@domain/entities/XPathCollection';
import { XPathOutputDto } from '../dtos/XPathOutputDto';

export class XPathMapper {
  static toOutputDto(data: XPathData): XPathOutputDto {
    return {
      id: data.id,
      websiteId: data.websiteId,
      value: data.value,
      actionType: data.actionType,
      executionOrder: data.executionOrder,
      url: data.url,
      selectedPathPattern: data.selectedPathPattern || '',
      afterWaitSeconds: data.afterWaitSeconds || 0,
      executionTimeoutSeconds: data.executionTimeoutSeconds || 0,
      retryType: data.retryType || 0,
      pathShort: data.pathShort,
      pathAbsolute: data.pathAbsolute,
      pathSmart: data.pathSmart,
      actionPattern: data.actionPattern?.toString(),
    };
  }

  static toOutputDtoArray(dataArray: XPathData[]): XPathOutputDto[] {
    return dataArray.map((data) => this.toOutputDto(data));
  }
}
