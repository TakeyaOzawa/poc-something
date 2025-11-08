/**
 * Presentation Layer: Export/Import Manager
 * Handles export and import operations for XPaths, Websites, and Automation Variables
 */

import { Logger } from '@domain/types/logger.types';
import { XPathManagerPresenter } from './XPathManagerPresenter';
import { CSVFormatDetectorService, CSV_FORMAT } from '@domain/services/CSVFormatDetectorService';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { DateFormatterService } from '@domain/services/DateFormatterService';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

export class ExportImportManager {
  constructor(
    private presenter: XPathManagerPresenter,
    private logger: Logger,
    private exportBtn: HTMLButtonElement
  ) {}

  /**
   * Show export menu with options
   */
  showExportMenu(): void {
    const menu = this.createExportMenu();
    this.positionMenu(menu);
    document.body.appendChild(menu);
    this.attachExportListeners(menu);
    this.setupMenuCloseBehavior(menu);
  }

  private createExportMenu(): HTMLDivElement {
    // Load template
    const fragment = TemplateLoader.load('export-menu-template');
    const menu = fragment.querySelector('.export-menu') as HTMLDivElement;

    // Set i18n messages for buttons
    const exportXPathsBtn = menu.querySelector('#exportXPathsBtn') as HTMLButtonElement;
    const exportWebsitesBtn = menu.querySelector('#exportWebsitesBtn') as HTMLButtonElement;
    const exportAutomationVariablesBtn = menu.querySelector(
      '#exportAutomationVariablesBtn'
    ) as HTMLButtonElement;

    if (exportXPathsBtn) {
      exportXPathsBtn.textContent = I18nAdapter.getMessage('exportXPaths');
    }
    if (exportWebsitesBtn) {
      exportWebsitesBtn.textContent = I18nAdapter.getMessage('exportWebsites');
    }
    if (exportAutomationVariablesBtn) {
      exportAutomationVariablesBtn.textContent = I18nAdapter.getMessage(
        'exportAutomationVariables'
      );
    }

    return menu;
  }

  private positionMenu(menu: HTMLDivElement): void {
    const btnRect = this.exportBtn.getBoundingClientRect();
    menu.style.top = `${btnRect.bottom + window.scrollY + 5}px`;
    menu.style.left = `${btnRect.left + window.scrollX}px`;
  }

  private attachExportListeners(menu: HTMLDivElement): void {
    const exportXPathsBtn = document.getElementById('exportXPathsBtn');
    const exportWebsitesBtn = document.getElementById('exportWebsitesBtn');
    const exportAutomationVariablesBtn = document.getElementById('exportAutomationVariablesBtn');

    exportXPathsBtn?.addEventListener('click', async () => {
      document.body.removeChild(menu);
      const csv = await this.exportXPaths();
      const dateFormatter = new DateFormatterService();
      this.downloadCSV(csv, `xpaths_${dateFormatter.formatForFilename()}.csv`);
    });

    exportWebsitesBtn?.addEventListener('click', async () => {
      document.body.removeChild(menu);
      const csv = await this.exportWebsites();
      const dateFormatter = new DateFormatterService();
      this.downloadCSV(csv, `websites_${dateFormatter.formatForFilename()}.csv`);
    });

    exportAutomationVariablesBtn?.addEventListener('click', async () => {
      document.body.removeChild(menu);
      const csv = await this.exportAutomationVariables();
      const dateFormatter = new DateFormatterService();
      this.downloadCSV(csv, `automation_variables_${dateFormatter.formatForFilename()}.csv`);
    });
  }

  private setupMenuCloseBehavior(menu: HTMLDivElement): void {
    setTimeout(() => {
      const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          if (document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  /**
   * Export XPaths to CSV
   */
  async exportXPaths(): Promise<string> {
    return await this.presenter.exportXPaths();
  }

  /**
   * Export Websites to CSV
   */
  async exportWebsites(): Promise<string> {
    return await this.presenter.exportWebsites();
  }

  /**
   * Export Automation Variables to CSV
   */
  async exportAutomationVariables(): Promise<string> {
    return await this.presenter.exportAutomationVariables();
  }

  /**
   * Import file with auto-detection of type
   */
  async importFile(
    file: File,
    onWebsitesImported: () => Promise<void>,
    onXPathsImported: () => Promise<void>
  ): Promise<void> {
    try {
      const text = await file.text();

      // Auto-detect CSV format
      const format = CSVFormatDetectorService.detectFormat(text);

      if (!CSVFormatDetectorService.isValidFormat(format)) {
        const errorMessage =
          'Unknown file format. Expected XPaths CSV, Websites CSV, or Automation Variables CSV.';
        this.logger.error(errorMessage);
        alert(I18nAdapter.format('importFailed', errorMessage));
        throw new Error(errorMessage);
      }

      const formatName = CSVFormatDetectorService.getFormatName(format);
      this.logger.info(`Importing ${formatName} CSV`);

      // Import based on detected format
      switch (format) {
        case CSV_FORMAT.WEBSITES:
          await this.presenter.importWebsites(text);
          await onWebsitesImported();
          break;
        case CSV_FORMAT.XPATHS:
          await this.presenter.importXPaths(text);
          await onXPathsImported();
          break;
        case CSV_FORMAT.AUTOMATION_VARIABLES:
          await this.presenter.importAutomationVariables(text);
          await onWebsitesImported();
          break;
      }
    } catch (error) {
      this.logger.error('Import error', error);
      if (error instanceof Error) {
        alert(I18nAdapter.format('importFailed', error.message));
      }
      throw error;
    }
  }

  /**
   * Download CSV file
   */
  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
