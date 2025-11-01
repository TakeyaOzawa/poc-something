/**
 * XPath Manager Entry Point
 * XPath管理画面のメインエントリーポイント
 */

import { XPathManagerPresenter } from './XPathManagerPresenter';
import { XPathManagerView } from './XPathManagerView';
import { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import { SaveXPathUseCase } from '@usecases/xpaths/SaveXPathUseCase';
import { UpdateXPathUseCase } from '@usecases/xpaths/UpdateXPathUseCase';
import { DeleteXPathUseCase } from '@usecases/xpaths/DeleteXPathUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { ChromeStorageXPathRepository } from '@infrastructure/repositories/ChromeStorageXPathRepository';
import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';

// DI Container (簡易版)
const xpathRepository = new ChromeStorageXPathRepository();
const websiteRepository = new ChromeStorageWebsiteRepository();

const getAllXPathsUseCase = new GetAllXPathsUseCase(xpathRepository);
const saveXPathUseCase = new SaveXPathUseCase(xpathRepository);
const updateXPathUseCase = new UpdateXPathUseCase(xpathRepository);
const deleteXPathUseCase = new DeleteXPathUseCase(xpathRepository);
const getAllWebsitesUseCase = new GetAllWebsitesUseCase(websiteRepository);

// View & Presenter
const view = new XPathManagerView();
const presenter = new XPathManagerPresenter(
  view,
  getAllXPathsUseCase,
  saveXPathUseCase,
  updateXPathUseCase,
  deleteXPathUseCase,
  getAllWebsitesUseCase
);

// グローバル関数（HTMLから呼び出し用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).editXPath = (id: string) => {
  console.log('Edit XPath:', id);
  // TODO: 編集モーダルの実装
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).deleteXPath = async (id: string) => {
  if (confirm('このXPath設定を削除しますか？')) {
    await presenter.deleteXPath(id);
  }
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  presenter.initialize();
});
