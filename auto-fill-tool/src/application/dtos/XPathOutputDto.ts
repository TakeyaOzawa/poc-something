/**
 * XPath Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface XPathOutputDto {
  id: string;
  websiteId: string;
  value: string;
  actionType: string;
  url: string;
  executionOrder: number;
  shortXPath?: string;
  absoluteXPath?: string;
  smartXPath?: string;
  selectedPathPattern: string;
  afterWaitSeconds: number;
  executionTimeoutSeconds: number;
  retryType: number;
  actionPattern?: string;
}
