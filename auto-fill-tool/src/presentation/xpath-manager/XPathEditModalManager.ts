/**
 * Presentation Layer: XPath Edit Modal Manager
 * Handles XPath edit modal operations
 *
 * @coverage 88.09%
 * @reason テストカバレッジが低い理由:
 * - 18個のDOM要素への参照設定、複数のアクションタイプごとの動的な
 *   オプション更新など、DOM操作が多く含まれており、完全なテストには
 *   複雑なDOM環境のセットアップが必要
 * - アクションタイプ変更時のフィールド可視性制御（lines 149-176）や
 *   動的なオプション生成（lines 178-275）の全ての組み合わせをテストするのは困難
 * - 現在のテストでは主要なフォーム操作とデータ収集をカバーしており、
 *   DOM操作の詳細な振る舞いには追加実装が必要
 */

import { Logger } from '@domain/types/logger.types';
import { XPathManagerPresenter, XPathManagerView } from './XPathManagerPresenter';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { RetryType } from '@domain/constants/RetryType';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

export class XPathEditModalManager {
  private editModal: HTMLDivElement;
  private editForm: HTMLFormElement;
  private editActionType: HTMLSelectElement;

  constructor(
    private presenter: XPathManagerPresenter,
    private logger: Logger,
    private view: XPathManagerView
  ) {
    this.editModal = document.getElementById('editModal') as HTMLDivElement;
    this.editForm = document.getElementById('editForm') as HTMLFormElement;
    this.editActionType = document.getElementById('editActionType') as HTMLSelectElement;
  }

  /**
   * Open edit modal for an XPath
   */
  async openEditModal(id: string): Promise<void> {
    try {
      const xpath = await this.presenter.getXPathById(id);

      if (!xpath) {
        return; // Error already handled by presenter
      }

      (document.getElementById('editId') as HTMLInputElement).value = xpath.id;
      (document.getElementById('editValue') as HTMLInputElement).value = xpath.value;
      (document.getElementById('editActionType') as HTMLSelectElement).value = xpath.actionType;
      (document.getElementById('editUrl') as HTMLInputElement).value = xpath.url;
      (document.getElementById('editExecutionOrder') as HTMLInputElement).value =
        xpath.executionOrder.toString();
      (document.getElementById('editSelectedPathPattern') as HTMLSelectElement).value =
        xpath.selectedPathPattern;
      (document.getElementById('editPathShort') as HTMLTextAreaElement).value = xpath.pathShort;
      (document.getElementById('editPathAbsolute') as HTMLTextAreaElement).value =
        xpath.pathAbsolute;
      (document.getElementById('editPathSmart') as HTMLTextAreaElement).value = xpath.pathSmart;
      (document.getElementById('editAfterWaitSeconds') as HTMLInputElement).value =
        xpath.afterWaitSeconds.toString();
      (document.getElementById('editExecutionTimeoutSeconds') as HTMLInputElement).value =
        xpath.executionTimeoutSeconds.toString();
      (document.getElementById('editRetryType') as HTMLInputElement).value =
        xpath.retryType.toString();

      // Update field visibility and options based on action type first
      this.handleActionTypeChange();

      // Then set the action pattern value (after options are populated)
      (document.getElementById('editActionPattern') as HTMLSelectElement).value =
        xpath.actionPattern.toString();

      this.editModal.classList.add('show');
    } catch (error) {
      this.logger.error('Failed to load XPath for editing', error);
      this.view.showError(I18nAdapter.getMessage('editDataLoadFailed'));
    }
  }

  /**
   * Close edit modal
   */
  closeModal(): void {
    this.editModal.classList.remove('show');
    this.editForm.reset();
  }

  /**
   * Save XPath from form
   */
  async saveXPath(): Promise<boolean> {
    const formData = this.collectFormData();

    try {
      await this.updateXPathData(formData);
      this.closeModal();
      return true;
    } catch (error) {
      // Error already handled by presenter
      return false;
    }
  }

  private collectFormData() {
    return {
      id: (document.getElementById('editId') as HTMLInputElement).value,
      value: (document.getElementById('editValue') as HTMLInputElement).value,
      actionType: (document.getElementById('editActionType') as HTMLSelectElement).value as
        | 'type'
        | 'click'
        | 'check'
        | 'judge'
        | 'select_value'
        | 'select_index'
        | 'select_text'
        | 'select_text_exact'
        | 'change_url'
        | 'screenshot'
        | 'get_value',
      url: (document.getElementById('editUrl') as HTMLInputElement).value,
      executionOrder: parseInt(
        (document.getElementById('editExecutionOrder') as HTMLInputElement).value
      ),
      selectedPathPattern: (document.getElementById('editSelectedPathPattern') as HTMLSelectElement)
        .value as 'absolute' | 'short' | 'smart' | '',
      pathShort: (document.getElementById('editPathShort') as HTMLTextAreaElement).value,
      pathAbsolute: (document.getElementById('editPathAbsolute') as HTMLTextAreaElement).value,
      pathSmart: (document.getElementById('editPathSmart') as HTMLTextAreaElement).value,
      actionPattern: parseInt(
        (document.getElementById('editActionPattern') as HTMLInputElement).value
      ),
      afterWaitSeconds: parseFloat(
        (document.getElementById('editAfterWaitSeconds') as HTMLInputElement).value
      ),
      executionTimeoutSeconds: parseFloat(
        (document.getElementById('editExecutionTimeoutSeconds') as HTMLInputElement).value
      ),
      retryType: parseInt(
        (document.getElementById('editRetryType') as HTMLInputElement).value
      ) as RetryType,
    };
  }

  private async updateXPathData(formData: any): Promise<void> {
    // Don't pass websiteId to preserve the original value
    // currentWebsiteId is just a filter for display, not the actual websiteId of the XPath
    await this.presenter.updateXPath(formData);
  }

  /**
   * Handle action type change to show/hide fields and update options
   */
  handleActionTypeChange(): void {
    const actionType = this.editActionType.value;
    this.updateXPathFieldsVisibility(actionType);
    this.updateActionPatternOptions(actionType);
    I18nAdapter.applyToDOM();
  }

  private updateXPathFieldsVisibility(actionType: string): void {
    const xpathFields = document.querySelectorAll('.xpath-field');
    const isChangeUrl = actionType === 'change_url';

    xpathFields.forEach((field) => {
      (field as HTMLElement).style.display = isChangeUrl ? 'none' : 'block';
    });

    this.updateXPathFieldsRequired(!isChangeUrl);
  }

  private updateXPathFieldsRequired(required: boolean): void {
    const fields = [
      'editSelectedPathPattern',
      'editPathShort',
      'editPathAbsolute',
      'editPathSmart',
    ];

    fields.forEach((fieldId) => {
      const field = document.getElementById(fieldId) as HTMLElement;
      if (required) {
        field.setAttribute('required', 'required');
      } else {
        field.removeAttribute('required');
      }
    });
  }

  private updateActionPatternOptions(actionType: string): void {
    const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
    const actionPatternLabel = document.getElementById(
      'editActionPatternLabel'
    ) as HTMLLabelElement;
    const actionPatternHelp = document.getElementById('actionPatternHelp') as HTMLParagraphElement;

    if (actionType === ACTION_TYPE.JUDGE) {
      this.setJudgePatternOptions(actionPatternLabel, actionPatternSelect, actionPatternHelp);
    } else if (this.isSelectActionType(actionType)) {
      this.setSelectPatternOptions(actionPatternLabel, actionPatternSelect, actionPatternHelp);
    } else if (this.isBasicEventActionType(actionType)) {
      this.setBasicEventPatternOptions(actionPatternLabel, actionPatternSelect, actionPatternHelp);
    } else if (actionType === ACTION_TYPE.SCREENSHOT) {
      this.setScreenshotPatternOptions(actionPatternLabel, actionPatternSelect, actionPatternHelp);
    } else if (actionType === ACTION_TYPE.GET_VALUE) {
      this.setGetValuePatternOptions(actionPatternLabel, actionPatternSelect, actionPatternHelp);
    } else {
      this.setDefaultPatternOptions(actionPatternLabel, actionPatternSelect, actionPatternHelp);
    }
  }

  private isSelectActionType(actionType: string): boolean {
    return (
      actionType === ACTION_TYPE.SELECT_VALUE ||
      actionType === ACTION_TYPE.SELECT_INDEX ||
      actionType === ACTION_TYPE.SELECT_TEXT ||
      actionType === ACTION_TYPE.SELECT_TEXT_EXACT
    );
  }

  private isBasicEventActionType(actionType: string): boolean {
    return (
      actionType === ACTION_TYPE.TYPE ||
      actionType === ACTION_TYPE.CLICK ||
      actionType === ACTION_TYPE.CHECK
    );
  }

  private setJudgePatternOptions(
    label: HTMLLabelElement,
    select: HTMLSelectElement,
    help: HTMLParagraphElement
  ): void {
    label.textContent = I18nAdapter.getMessage('comparisonMethod');
    const fragment = TemplateLoader.load('xpath-action-pattern-judge-template');
    select.innerHTML = '';
    select.appendChild(fragment);
    help.textContent = I18nAdapter.getMessage('comparisonMethodHelp');
    help.style.display = 'block';
  }

  private setSelectPatternOptions(
    label: HTMLLabelElement,
    select: HTMLSelectElement,
    help: HTMLParagraphElement
  ): void {
    label.textContent = I18nAdapter.getMessage('selectOptionsLabel');
    const fragment = TemplateLoader.load('xpath-action-pattern-select-template');
    select.innerHTML = '';
    select.appendChild(fragment);
    help.textContent = I18nAdapter.getMessage('selectPatternHelp');
    help.style.display = 'block';
  }

  private setBasicEventPatternOptions(
    label: HTMLLabelElement,
    select: HTMLSelectElement,
    help: HTMLParagraphElement
  ): void {
    label.textContent = I18nAdapter.getMessage('eventPattern');
    const fragment = TemplateLoader.load('xpath-action-pattern-basic-template');
    select.innerHTML = '';
    select.appendChild(fragment);
    help.textContent = I18nAdapter.getMessage('eventPatternHelp');
    help.style.display = 'block';
  }

  private setDefaultPatternOptions(
    label: HTMLLabelElement,
    select: HTMLSelectElement,
    help: HTMLParagraphElement
  ): void {
    label.textContent = I18nAdapter.getMessage('actionPattern');
    const fragment = TemplateLoader.load('xpath-action-pattern-default-template');
    select.innerHTML = '';
    select.appendChild(fragment);
    help.style.display = 'none';
  }

  private setScreenshotPatternOptions(
    label: HTMLLabelElement,
    select: HTMLSelectElement,
    help: HTMLParagraphElement
  ): void {
    label.textContent = I18nAdapter.getMessage('screenshotQuality');
    const fragment = TemplateLoader.load('xpath-action-pattern-screenshot-template');
    select.innerHTML = '';
    select.appendChild(fragment);
    help.textContent = I18nAdapter.getMessage('screenshotQualityHelp');
    help.style.display = 'block';
  }

  private setGetValuePatternOptions(
    label: HTMLLabelElement,
    select: HTMLSelectElement,
    help: HTMLParagraphElement
  ): void {
    label.textContent = I18nAdapter.getMessage('getValuePattern');
    const fragment = TemplateLoader.load('xpath-action-pattern-getvalue-template');
    select.innerHTML = '';
    select.appendChild(fragment);
    help.textContent = I18nAdapter.getMessage('getValuePatternHelp');
    help.style.display = 'block';
  }
}
