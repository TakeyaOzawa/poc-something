/**
 * DeleteWebsiteUseCase
 * Website設定を削除するユースケース
 */

export interface WebsiteRepository {
  delete(id: string): Promise<boolean>;
}

export class DeleteWebsiteUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(id: string): Promise<boolean> {
    return await this.websiteRepository.delete(id);
  }
}
