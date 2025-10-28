/**
 * Presentation Layer: Modal Manager
 * Handles modal dialog operations for website editing
 */

import { WebsiteData } from '@domain/entities/Website';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { TemplateLoader } from '../common/TemplateLoader';
import { DataBinder } from '../common/DataBinder';

export class ModalManager {
  private editForm: HTMLFormElement;
  private variablesList: HTMLDivElement;

  constructor(
    private editingIdGetter: () => string | null,
    private editingIdSetter: (id: string | null) => void
  ) {
    this.editForm = document.getElementById('editForm') as HTMLFormElement;
    this.variablesList = document.getElementById('variablesList') as HTMLDivElement;
  }

  /**
   * Open modal for adding a new website
   * Note: Modal visibility is controlled by Alpine.js showModal state
   */
  openAddModal(): void {
    this.editingIdSetter(null);
    this.editForm.reset();
    (document.getElementById('editId') as HTMLInputElement).value = '';
    (document.getElementById('editName') as HTMLInputElement).value = '';
    (document.getElementById('editStatus') as HTMLSelectElement).value = 'once';
    (document.getElementById('editEditable') as HTMLSelectElement).value = 'true';
    (document.getElementById('editStartUrl') as HTMLInputElement).value = '';
    this.variablesList.innerHTML = '';
  }

  /**
   * Open modal for editing an existing website
   * Note: Modal visibility is controlled by Alpine.js showModal state
   */
  openEditModal(website: WebsiteData, automationVariables?: AutomationVariables | null): void {
    this.editingIdSetter(website.id);
    (document.getElementById('editId') as HTMLInputElement).value = website.id;
    (document.getElementById('editName') as HTMLInputElement).value = website.name;
    (document.getElementById('editStatus') as HTMLSelectElement).value =
      automationVariables?.getStatus() || AUTOMATION_STATUS.ONCE;
    (document.getElementById('editEditable') as HTMLSelectElement).value = website.editable
      ? 'true'
      : 'false';
    (document.getElementById('editStartUrl') as HTMLInputElement).value = website.startUrl || '';

    // Render variables
    this.variablesList.innerHTML = '';
    const variables = automationVariables?.getVariables() || {};
    Object.entries(variables).forEach(([name, value]) => {
      this.addVariableField(name, value);
    });
  }

  /**
   * Close the modal
   * Note: Modal visibility is controlled by Alpine.js showModal state
   */
  closeModal(): void {
    this.editForm.reset();
    this.editingIdSetter(null);
  }

  /**
   * Add a variable input field using template
   */
  addVariableField(name: string = '', value: string = ''): void {
    // Load template
    const fragment = TemplateLoader.load('modal-variable-item-template');
    const container = document.createElement('div');
    container.appendChild(fragment);

    const variableItem = container.firstElementChild as HTMLElement;

    // Bind data to template
    DataBinder.bindAttributes(variableItem, {
      namePlaceholder: I18nAdapter.getMessage('variableName'),
      valuePlaceholder: I18nAdapter.getMessage('value'),
      name: name,
      value: value,
    });

    // Attach remove button event listener
    const removeBtn = variableItem.querySelector('.modal-variable-remove') as HTMLButtonElement;
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        variableItem.remove();
      });
    }

    this.variablesList.appendChild(variableItem);
  }

  /**
   * Collect form data for saving
   */
  getFormData(): {
    name: string;
    status: 'disabled' | 'enabled' | 'once';
    editable: boolean;
    startUrl: string;
    variables: { [key: string]: string };
  } {
    const name = (document.getElementById('editName') as HTMLInputElement).value.trim();
    const status = (document.getElementById('editStatus') as HTMLSelectElement).value as
      | 'disabled'
      | 'enabled'
      | 'once';
    const editable =
      (document.getElementById('editEditable') as HTMLSelectElement).value === 'true';
    const startUrl = (document.getElementById('editStartUrl') as HTMLInputElement).value.trim();

    // Collect variables
    const variables: { [key: string]: string } = {};
    const variableItems = this.variablesList.querySelectorAll('.modal-variable-item');
    variableItems.forEach((item) => {
      const nameInput = item.querySelector('.modal-variable-name') as HTMLInputElement;
      const valueInput = item.querySelector('.modal-variable-value') as HTMLInputElement;
      const varName = nameInput.value.trim();
      const varValue = valueInput.value.trim();

      if (varName) {
        variables[varName] = varValue;
      }
    });

    return { name, status, editable, startUrl, variables };
  }
}
