/**
 * Presentation Layer: Variable Manager
 * Manages website variables in XPath Manager
 *
 * HTML/CSS are separated:
 * - Template: public/components/variable-item.html
 * - Styles: public/styles/variable-item.css
 */

import { LoggerFactory, Logger } from '@/infrastructure/loggers/LoggerFactory';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@usecases/websites/UpdateWebsiteUseCase';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { XPathManagerView } from './XPathManagerPresenter';
import { TemplateLoader } from '../common/TemplateLoader';
import { DataBinder } from '../common/DataBinder';
import { UuidIdGenerator } from '@/infrastructure/adapters/UuidIdGenerator';

export class VariableManager {
  private automationVariablesRepository: ChromeStorageAutomationVariablesRepository;

  // eslint-disable-next-line max-params
  constructor(
    private variablesList: HTMLDivElement,
    private newVariableName: HTMLInputElement,
    private newVariableValue: HTMLInputElement,
    private logger: Logger,
    private view: XPathManagerView,
    private getCurrentWebsiteId: () => string,
    private getWebsiteByIdUseCase: GetWebsiteByIdUseCase,
    private updateWebsiteUseCase: UpdateWebsiteUseCase,
    private idGenerator: UuidIdGenerator
  ) {
    this.automationVariablesRepository = new ChromeStorageAutomationVariablesRepository(
      logger.createChild('AutomationVariables')
    );
  }

  /**
   * Load and display variables for current website
   */
  async loadVariables(): Promise<void> {
    try {
      const currentWebsiteId = this.getCurrentWebsiteId();

      // If no website is selected, show message
      if (!currentWebsiteId) {
        this.variablesList.innerHTML = '';
        this.variablesList.appendChild(
          this.createStateMessage('サイトを選択してください', 'variable-select-prompt')
        );
        return;
      }

      // Load website using UseCase
      const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId: currentWebsiteId });

      if (!website) {
        this.variablesList.innerHTML = '';
        this.variablesList.appendChild(
          this.createStateMessage('サイトが見つかりません', 'variable-error-state')
        );
        return;
      }

      // Load automation variables
      const result = await this.automationVariablesRepository.load(currentWebsiteId);
      const automationVariables = result.isSuccess ? result.value : null;
      const variables = Object.entries(automationVariables?.getVariables() || {});

      if (variables.length === 0) {
        this.variablesList.innerHTML = '';
        this.variablesList.appendChild(
          this.createStateMessage('変数が登録されていません', 'variable-empty-state')
        );
        return;
      }

      // Clear and render variable items using template
      this.variablesList.innerHTML = '';
      variables.forEach(([name, value]) => {
        const itemElement = this.renderVariableItem(name, value);
        this.variablesList.appendChild(itemElement);

        // Attach delete handler
        const deleteBtn = itemElement.querySelector('.variable-delete');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm(I18nAdapter.format('confirmDeleteVariable', name))) {
              await this.deleteVariable(name);
            }
          });
        }
      });
    } catch (error) {
      this.logger.error('Failed to load variables', error);
      this.variablesList.innerHTML = '';
      this.variablesList.appendChild(
        this.createStateMessage('変数の読み込みに失敗しました', 'variable-error-state')
      );
    }
  }

  /**
   * Add a new variable
   */
  async addVariable(): Promise<void> {
    const name = this.newVariableName.value.trim();
    const value = this.newVariableValue.value.trim();

    if (!name || !value) {
      this.view.showError(I18nAdapter.getMessage('variableNameAndValueRequired'));
      return;
    }

    const currentWebsiteId = this.getCurrentWebsiteId();
    if (!currentWebsiteId) {
      this.view.showError(I18nAdapter.getMessage('selectWebsitePrompt'));
      return;
    }

    try {
      // Load website using UseCase to verify it exists
      const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId: currentWebsiteId });
      if (!website) {
        this.view.showError(I18nAdapter.getMessage('websiteNotFound'));
        return;
      }

      // Load or create automation variables
      const loadResult = await this.automationVariablesRepository.load(currentWebsiteId);
      let automationVariables = loadResult.isSuccess ? loadResult.value : null;
      if (!automationVariables) {
        const { AutomationVariables } = await import('@domain/entities/AutomationVariables');
        automationVariables = AutomationVariables.create(
          {
            websiteId: currentWebsiteId,
          },
          this.idGenerator
        );
      }

      // Add variable
      const updatedAv = automationVariables.setVariable(name, value);
      await this.automationVariablesRepository.save(updatedAv);

      await this.loadVariables();
      this.newVariableName.value = '';
      this.newVariableValue.value = '';
    } catch (error) {
      this.logger.error('Failed to add variable', error);
      this.view.showError(I18nAdapter.getMessage('variableAddFailed'));
    }
  }

  /**
   * Delete a variable
   */
  private async deleteVariable(name: string): Promise<void> {
    const currentWebsiteId = this.getCurrentWebsiteId();
    if (!currentWebsiteId) {
      this.view.showError(I18nAdapter.getMessage('selectWebsitePrompt'));
      return;
    }

    try {
      // Load website using UseCase to verify it exists
      const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId: currentWebsiteId });
      if (!website) {
        this.view.showError(I18nAdapter.getMessage('websiteNotFound'));
        return;
      }

      // Load automation variables
      const deleteResult = await this.automationVariablesRepository.load(currentWebsiteId);
      const automationVariables = deleteResult.isSuccess ? deleteResult.value : null;
      if (!automationVariables) {
        this.view.showError(I18nAdapter.getMessage('variableNotFound'));
        return;
      }

      // Delete variable
      const updatedAv = automationVariables.removeVariable(name);
      await this.automationVariablesRepository.save(updatedAv);

      await this.loadVariables();
    } catch (error) {
      this.logger.error('Failed to delete variable', error);
      this.view.showError(I18nAdapter.getMessage('variableDeleteFailed'));
    }
  }

  /**
   * Render a single variable item using template
   */
  private renderVariableItem(name: string, value: string): HTMLElement {
    const fragment = TemplateLoader.load('variable-item-template');
    const container = document.createElement('div');
    container.appendChild(fragment);

    const itemElement = container.firstElementChild as HTMLElement;

    // Bind data to template
    DataBinder.bind(itemElement, {
      name: `{{${name}}}`,
      value: value,
    });

    // Bind variableName attribute for delete handler
    DataBinder.bindAttributes(itemElement, {
      variableName: name,
    });

    return itemElement;
  }

  /**
   * Create a state message element (empty, error, prompt)
   */
  private createStateMessage(message: string, className: string): HTMLDivElement {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = message;
    return div;
  }
}
