/**
 * Use Case: Get Websites
 */

import { Website, WebsiteData } from '../domain/entities/Website';

export interface WebsiteRepository {
  findAll(): Promise<WebsiteData[]>;
}

export class GetWebsitesUseCase {
  constructor(private websiteRepository: WebsiteRepository) {}

  async execute(): Promise<Website[]> {
    const websiteDataList = await this.websiteRepository.findAll();
    return websiteDataList.map(data => Website.create(data));
  }
}
