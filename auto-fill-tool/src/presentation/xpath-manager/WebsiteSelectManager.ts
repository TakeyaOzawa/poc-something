/**
 * Presentation Layer: Website Select Manager
 * Manages website selection dropdown
 */

import { Logger } from '@domain/types/logger.types';
import { WebsiteData } from '@domain/entities/Website';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@usecases/websites/UpdateWebsiteUseCase';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

export class WebsiteSelectManager {
  // eslint-disable-next-line max-params
  constructor(
    private websiteSelect: HTMLSelectElement,
    private logger: Logger,
    private onWebsiteChange: (websiteId: string) => void,
    private getAllWebsitesUseCase: GetAllWebsitesUseCase,
    private getWebsiteByIdUseCase: GetWebsiteByIdUseCase,
    private updateWebsiteUseCase: UpdateWebsiteUseCase
  ) {}

  /**
   * Initialize and attach event listener
   */
  initialize(): void {
    this.websiteSelect.addEventListener('change', () => {
      this.onWebsiteChange(this.websiteSelect.value);
    });
    this.loadWebsiteSelect();
  }

  /**
   * Get current selected website ID
   */
  getCurrentWebsiteId(): string {
    return this.websiteSelect.value;
  }

  /**
   * Load websites into select dropdown
   */
  async loadWebsiteSelect(): Promise<void> {
    try {
      const { websites } = await this.getAllWebsitesUseCase.execute();

      // Clear existing options
      this.websiteSelect.textContent = '';

      // Add "All Sites" option using template
      const allSitesFragment = TemplateLoader.load('website-select-option-template');
      const allSitesOption = allSitesFragment.querySelector('.website-option') as HTMLOptionElement;
      if (allSitesOption) {
        allSitesOption.value = '';
        allSitesOption.textContent = I18nAdapter.getMessage('allSites');
      }
      this.websiteSelect.appendChild(allSitesFragment);

      // Add website options
      if (websites) {
        websites.forEach((website) => {
          const option = document.createElement('option');
          option.value = website.id;
          option.textContent = website.name;
          this.websiteSelect.appendChild(option);
        });
      }
    } catch (error) {
      this.logger.error('Failed to load website select', error);
    }
  }

  /**
   * Get website config by ID
   */
  async getWebsiteById(websiteId: string): Promise<WebsiteData | null> {
    try {
      const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId });
      return website || null;
    } catch (error) {
      this.logger.error('Failed to get website by ID', error);
      return null;
    }
  }

  /**
   * Update website config
   */
  async updateWebsite(websiteId: string, updates: Partial<WebsiteData>): Promise<void> {
    try {
      const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId });
      if (!website) {
        throw new Error('Website not found');
      }

      await this.updateWebsiteUseCase.execute({
        websiteData: {
          ...website,
          ...updates,
        },
      });
    } catch (error) {
      this.logger.error('Failed to update website', error);
      throw error;
    }
  }
}
