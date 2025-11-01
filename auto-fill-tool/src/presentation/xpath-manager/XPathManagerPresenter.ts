/**
 * XPathManagerPresenter
 * XPath管理画面のPresenter（ビジネスロジック層）
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { WebsiteData } from '@domain/entities/Website';
import { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import { SaveXPathUseCase } from '@usecases/xpaths/SaveXPathUseCase';
import { UpdateXPathUseCase } from '@usecases/xpaths/UpdateXPathUseCase';
import { DeleteXPathUseCase } from '@usecases/xpaths/DeleteXPathUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';

export interface IXPathManagerView {
  showXPaths(xpaths: XPathData[]): void;
  showWebsites(websites: WebsiteData[]): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(isLoading: boolean): void;
}

export class XPathManagerPresenter {
  constructor(
    private view: IXPathManagerView,
    private getAllXPathsUseCase: GetAllXPathsUseCase,
    private saveXPathUseCase: SaveXPathUseCase,
    private updateXPathUseCase: UpdateXPathUseCase,
    private deleteXPathUseCase: DeleteXPathUseCase,
    private getAllWebsitesUseCase: GetAllWebsitesUseCase
  ) {}

  async initialize(): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.loadXPaths();
      await this.loadWebsites();
    } catch (error) {
      this.view.showError('初期化に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async loadXPaths(): Promise<void> {
    try {
      const xpathCollection = await this.getAllXPathsUseCase.execute();
      this.view.showXPaths(xpathCollection.getAll());
    } catch (error) {
      this.view.showError('XPath設定の読み込みに失敗しました');
    }
  }

  async loadWebsites(): Promise<void> {
    try {
      const websites = await this.getAllWebsitesUseCase.execute();
      this.view.showWebsites(websites.map(w => w.toData()));
    } catch (error) {
      this.view.showError('Webサイト設定の読み込みに失敗しました');
    }
  }

  async saveXPath(xpathData: XPathData): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.saveXPathUseCase.execute(xpathData);
      this.view.showSuccess('XPath設定を保存しました');
      await this.loadXPaths();
    } catch (error) {
      this.view.showError('XPath設定の保存に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async updateXPath(id: string, updates: Partial<XPathData>): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.updateXPathUseCase.execute(id, updates);
      this.view.showSuccess('XPath設定を更新しました');
      await this.loadXPaths();
    } catch (error) {
      this.view.showError('XPath設定の更新に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async deleteXPath(id: string): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.deleteXPathUseCase.execute(id);
      this.view.showSuccess('XPath設定を削除しました');
      await this.loadXPaths();
    } catch (error) {
      this.view.showError('XPath設定の削除に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }
}
