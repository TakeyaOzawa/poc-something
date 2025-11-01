/**
 * SaveWebsiteUseCase
 * Website設定を保存するユースケース
 */

import { Website } from '@domain/entities/Website';

export interface WebsiteRepository {
  save(website: Website): Promise<void>;
}

export class SaveWebsiteUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(website: Website): Promise<void> {
    await this.websiteRepository.save(website);
  }
}
