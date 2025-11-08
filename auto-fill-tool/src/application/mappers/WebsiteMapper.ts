/**
 * Application Layer: Website Mapper
 * Maps domain entities to DTOs
 */

import { WebsiteData } from '@domain/entities/Website';
import { WebsiteOutputDto } from '../dtos/WebsiteOutputDto';

export class WebsiteMapper {
  static toOutputDto(websiteData: WebsiteData): WebsiteOutputDto {
    return {
      id: websiteData.id,
      name: websiteData.name,
      startUrl: websiteData.startUrl ?? '',
      status: 'enabled', // デフォルト値
      editable: websiteData.editable,
      updatedAt: websiteData.updatedAt,
    };
  }

  static toOutputDtoArray(websiteDataArray: WebsiteData[]): WebsiteOutputDto[] {
    return websiteDataArray.map((websiteData) => this.toOutputDto(websiteData));
  }
}
