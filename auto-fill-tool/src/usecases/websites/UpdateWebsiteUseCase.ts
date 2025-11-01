/**
 * UpdateWebsiteUseCase
 * Website設定を更新するユースケース
 */

import { Website } from '@domain/entities/Website';

export interface WebsiteRepository {
  update(website: Website): Promise<void>;
}

export class UpdateWebsiteUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(website: Website): Promise<void> {
    await this.websiteRepository.update(website);
  }
}
