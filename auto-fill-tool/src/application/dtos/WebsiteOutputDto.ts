/**
 * Website Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface WebsiteOutputDto {
  id: string;
  name: string;
  startUrl?: string;
  status: string;
  editable: boolean;
  updatedAt: string;
}
