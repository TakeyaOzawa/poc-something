/**
 * Automation Variables Manager Entry Point
 * 自動化変数管理画面のメインエントリーポイント
 */

import { AutomationVariablesManagerPresenter } from './AutomationVariablesManagerPresenter';
import { AutomationVariablesManagerView } from './AutomationVariablesManagerView';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { UpdateAutomationVariablesUseCase } from '@usecases/automation-variables/UpdateAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';

// DI Container
const repository = new ChromeStorageAutomationVariablesRepository();

const getAllVariablesUseCase = new GetAllAutomationVariablesUseCase(repository);
const saveVariablesUseCase = new SaveAutomationVariablesUseCase(repository);
const updateVariablesUseCase = new UpdateAutomationVariablesUseCase(repository);
const deleteVariablesUseCase = new DeleteAutomationVariablesUseCase(repository);

// View & Presenter
const view = new AutomationVariablesManagerView();
const presenter = new AutomationVariablesManagerPresenter(
  view,
  getAllVariablesUseCase,
  saveVariablesUseCase,
  updateVariablesUseCase,
  deleteVariablesUseCase
);

// グローバル関数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).editVariables = (id: string) => {
  console.log('Edit Variables:', id);
  // TODO: 編集モーダルの実装
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).deleteVariables = async (id: string) => {
  if (confirm('この自動化変数を削除しますか？')) {
    await presenter.deleteVariables(id);
  }
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  presenter.initialize();
});
