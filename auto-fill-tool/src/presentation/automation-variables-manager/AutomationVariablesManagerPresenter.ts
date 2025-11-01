/**
 * AutomationVariablesManagerPresenter
 * 自動化変数管理画面のPresenter
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { UpdateAutomationVariablesUseCase } from '@usecases/automation-variables/UpdateAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';

export interface IAutomationVariablesManagerView {
  showVariables(variables: AutomationVariables[]): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(isLoading: boolean): void;
}

export class AutomationVariablesManagerPresenter {
  constructor(
    private view: IAutomationVariablesManagerView,
    private getAllVariablesUseCase: GetAllAutomationVariablesUseCase,
    private saveVariablesUseCase: SaveAutomationVariablesUseCase,
    private updateVariablesUseCase: UpdateAutomationVariablesUseCase,
    private deleteVariablesUseCase: DeleteAutomationVariablesUseCase
  ) {}

  async initialize(): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.loadVariables();
    } catch (error) {
      this.view.showError('初期化に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async loadVariables(): Promise<void> {
    try {
      const variables = await this.getAllVariablesUseCase.execute();
      this.view.showVariables(variables);
    } catch (error) {
      this.view.showError('自動化変数の読み込みに失敗しました');
    }
  }

  async saveVariables(variables: AutomationVariables): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.saveVariablesUseCase.execute(variables);
      this.view.showSuccess('自動化変数を保存しました');
      await this.loadVariables();
    } catch (error) {
      this.view.showError('自動化変数の保存に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async updateVariables(variables: AutomationVariables): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.updateVariablesUseCase.execute(variables);
      this.view.showSuccess('自動化変数を更新しました');
      await this.loadVariables();
    } catch (error) {
      this.view.showError('自動化変数の更新に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async deleteVariables(id: string): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.deleteVariablesUseCase.execute(id);
      this.view.showSuccess('自動化変数を削除しました');
      await this.loadVariables();
    } catch (error) {
      this.view.showError('自動化変数の削除に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }
}
