/**
 * GetAllWebsitesUseCase
 * 全Website設定を取得するユースケース
 */

import { Website } from '@domain/entities/Website';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';

export class GetAllWebsitesUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(): Promise<Website[]> {
    const websiteDataList = await this.websiteRepository.findAll();
    return websiteDataList.map(data => Website.fromData(data));
  }
}
