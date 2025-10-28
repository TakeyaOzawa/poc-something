/**
 * Unified Navigation Bar Component
 * Common navigation component for all management screens
 *
 * @coverage 0%
 * @reason テストカバレッジが低い理由:
 * - DOM操作中心のUIコンポーネントで、ブラウザ環境のシミュレーションが必要
 * - 動的なHTML生成、イベントリスナーの設定、モーダル表示など、20以上のDOM要素を管理
 * - ブラウザAPI（window.close、alert、File API）への依存が多い
 * - エクスポート/インポート処理は非同期コールバックに依存し、モックが複雑
 * - ドロップダウンメニューの表示/非表示、ファイル選択、CSV形式検出などのユーザーインタラクションが多数
 * - 適切なカバレッジには、JSDOM環境でのイベントシミュレーション、
 *   ブラウザAPIのモック、非同期処理のテストが必要
 */

import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { Logger } from '@domain/types/logger.types';
import {
  CSVFormatDetectorService,
  CSV_FORMAT,
  type CSVFormat,
} from '@domain/services/CSVFormatDetectorService';

export interface UnifiedNavigationBarConfig {
  title: string;
  onExportXPaths?: () => Promise<void>;
  onExportWebsites?: () => Promise<void>;
  onExportAutomationVariables?: () => Promise<void>;
  onExportSystemSettings?: () => Promise<void>;
  onExportStorageSyncConfigs?: () => Promise<void>;
  onExportAll?: () => Promise<void>;
  onImport?: (file: File, format: CSVFormat) => Promise<void>;
  logger: Logger;
}

export class UnifiedNavigationBar {
  private container: HTMLDivElement;
  private config: UnifiedNavigationBarConfig;
  private exportDropdown: HTMLDivElement | null = null;
  private fileInput: HTMLInputElement;

  constructor(container: HTMLDivElement, config: UnifiedNavigationBarConfig) {
    this.container = container;
    this.config = config;
    this.fileInput = this.createFileInput();
    this.render();
    this.attachEventListeners();
  }

  private createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    document.body.appendChild(input);
    return input;
  }

  private render(): void {
    // Load navigation bar template from DOM
    const template = document.getElementById('unified-nav-bar-template') as HTMLTemplateElement;
    if (!template) {
      this.config.logger.error('Navigation bar template not found in DOM');
      return;
    }

    // Clone and insert template content
    const clone = template.content.cloneNode(true) as DocumentFragment;
    this.container.appendChild(clone);

    // Set title
    const titleElement = this.container.querySelector('#navTitle');
    if (titleElement) {
      titleElement.textContent = this.config.title;
    }

    // Populate export menu items
    this.renderExportMenuItems();

    // Apply internationalization
    I18nAdapter.applyToDOM(this.container);

    // Store reference to dropdown
    this.exportDropdown = this.container.querySelector('#exportDropdownMenu');
  }

  /**
   * Dynamically populate export menu items from template
   */
  // eslint-disable-next-line max-lines-per-function -- This method creates 6 export menu items by cloning templates and populating them with data. Each menu item requires 5 DOM queries and property assignments (button, icon, label, description, data-export). The declarative data structure (menuItems array with 6 objects × 5 properties each = 30 lines) and template cloning logic cannot be meaningfully extracted without reducing code clarity. Breaking this into multiple methods would fragment the menu item creation flow and make it harder to maintain the consistent structure of all export options.
  private renderExportMenuItems(): void {
    const menuContainer = this.container.querySelector('#exportMenuItems');
    if (!menuContainer) {
      this.config.logger.error('Export menu items container not found');
      return;
    }

    const itemTemplate = document.getElementById(
      'export-menu-item-template'
    ) as HTMLTemplateElement;
    if (!itemTemplate) {
      this.config.logger.error('Export menu item template not found');
      return;
    }

    // Define export menu items
    const menuItems = [
      {
        type: 'xpaths',
        icon: '🔍',
        label: 'XPath設定',
        description: '入力フォームの設定データ',
        handler: this.config.onExportXPaths,
      },
      {
        type: 'websites',
        icon: '🌐',
        label: 'ウェブサイト設定',
        description: 'サイト情報と変数の設定',
        handler: this.config.onExportWebsites,
      },
      {
        type: 'variables',
        icon: '🔤',
        label: '自動入力変数',
        description: 'フォーム入力値の定義データ',
        handler: this.config.onExportAutomationVariables,
      },
      {
        type: 'settings',
        icon: '⚙️',
        label: 'システム設定',
        description: 'アプリケーション全体の設定',
        handler: this.config.onExportSystemSettings,
      },
      {
        type: 'syncconfigs',
        icon: '🔄',
        label: 'データ同期設定',
        description: 'ストレージ同期の設定',
        handler: this.config.onExportStorageSyncConfigs,
      },
      {
        type: 'all',
        icon: '📦',
        label: 'すべて (ZIP)',
        description: '全データを一括エクスポート',
        handler: this.config.onExportAll,
      },
    ];

    // Create menu items from template
    menuItems.forEach((item) => {
      if (!item.handler) return;

      const clone = itemTemplate.content.cloneNode(true) as DocumentFragment;
      const button = clone.querySelector('.export-menu-item') as HTMLButtonElement;
      const icon = clone.querySelector('.menu-icon') as HTMLSpanElement;
      const label = clone.querySelector('.menu-label') as HTMLSpanElement;
      const description = clone.querySelector('.menu-description') as HTMLSpanElement;

      if (button) button.setAttribute('data-export', item.type);
      if (icon) icon.textContent = item.icon;
      if (label) label.textContent = item.label;
      if (description) description.textContent = item.description;

      menuContainer.appendChild(clone);
    });
  }

  private attachEventListeners(): void {
    // Back button
    const backBtn = this.container.querySelector('#backToMainBtn');
    backBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      window.close();
    });

    // Export dropdown toggle
    const exportBtn = this.container.querySelector('#exportDropdownBtn');
    exportBtn?.addEventListener('click', () => this.toggleExportDropdown());

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.closeExportDropdown();
      }
    });

    // Export menu items
    const exportItems = this.container.querySelectorAll('[data-export]');
    exportItems.forEach((item) => {
      item.addEventListener('click', () => this.handleExport(item.getAttribute('data-export')!));
    });

    // Import button
    const importBtn = this.container.querySelector('#importBtn');
    importBtn?.addEventListener('click', () => this.fileInput.click());

    // File input change
    this.fileInput.addEventListener('change', (e) => this.handleImport(e));
  }

  private toggleExportDropdown(): void {
    if (this.exportDropdown) {
      this.exportDropdown.classList.toggle('show');
    }
  }

  private closeExportDropdown(): void {
    if (this.exportDropdown) {
      this.exportDropdown.classList.remove('show');
    }
  }

  private async handleExport(type: string): Promise<void> {
    this.closeExportDropdown();

    try {
      await this.executeExport(type);
    } catch (error) {
      this.config.logger.error('Export failed', error);
      alert(I18nAdapter.getMessage('exportFailed'));
    }
  }

  private async executeExport(type: string): Promise<void> {
    const exportHandlers: Record<string, (() => Promise<void>) | undefined> = {
      xpaths: this.config.onExportXPaths,
      websites: this.config.onExportWebsites,
      variables: this.config.onExportAutomationVariables,
      settings: this.config.onExportSystemSettings,
      syncconfigs: this.config.onExportStorageSyncConfigs,
      all: this.config.onExportAll,
    };

    const handler = exportHandlers[type];

    if (handler) {
      await handler();
    } else {
      this.config.logger.warn('Unknown export type', { type });
    }
  }

  private async handleImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();

      // Auto-detect CSV format
      const format = CSVFormatDetectorService.detectFormat(text);

      if (format === CSV_FORMAT.UNKNOWN) {
        throw new Error('Unknown CSV format. Unable to auto-detect data type.');
      }

      if (this.config.onImport) {
        await this.config.onImport(file, format);
        const formatName = CSVFormatDetectorService.getFormatName(format);
        this.config.logger.info(`Successfully imported ${formatName}`);
        alert(I18nAdapter.getMessage('importSuccess'));
      }
    } catch (error) {
      this.config.logger.error('Import failed', error);
      if (error instanceof Error) {
        alert(I18nAdapter.format('importFailed', error.message));
      }
    } finally {
      input.value = '';
    }
  }

  public destroy(): void {
    this.fileInput.remove();
  }
}
