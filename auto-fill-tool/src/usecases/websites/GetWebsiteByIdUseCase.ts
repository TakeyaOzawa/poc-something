/**
 * GetWebsiteByIdUseCase
 * IDでWebsite設定を取得するユースケース
 */

import { Website } from '@domain/entities/Website';

export interface WebsiteRepository {
  getById(id: string): Promise<Website | undefined>;
}

export class GetWebsiteByIdUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(id: string): Promise<Website | undefined> {
    return await this.websiteRepository.getById(id);
  }
}
