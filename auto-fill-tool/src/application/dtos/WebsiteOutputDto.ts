/**
 * Website Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface WebsiteOutputDto {
  id: string;
  name: string;
  startUrl: string | undefined;
  status: 'disabled' | 'enabled' | 'once';
  editable: boolean;
  updatedAt: string;
}
