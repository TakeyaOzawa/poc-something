/**
 * Test: Modal Manager
 */

import { ModalManager } from '../ModalManager';
import { WebsiteData } from '@domain/entities/Website';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  i18n: {
    getMessage: jest.fn((key: string) => {
      // Return the key as default, or specific mock values if needed
      return key;
    }),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ModalManager', () => {
  let modalManager: ModalManager;
  let editingId: string | null;
  let editModal: HTMLDivElement;
  let variablesList: HTMLDivElement;

  const mockWebsite: WebsiteData = {
    id: 'website_123',
    name: 'Test Website',
    updatedAt: '2025-01-01T00:00:00Z',
    editable: true,
    startUrl: 'https://example.com',
  };

  const mockAutomationVariablesData: AutomationVariablesData = {
    id: 'automation-variables-123',
    websiteId: 'website_123',
    status: 'enabled',
    variables: {
      username: 'testuser',
      password: 'testpass',
    },
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockAutomationVariables = new AutomationVariables(mockAutomationVariablesData);

  beforeEach(() => {
    // Clear any existing DOM
    document.body.innerHTML = '';

    // Setup modal-variable-item-template for ModalManager component
    const modalVariableItemTemplate = document.createElement('template');
    modalVariableItemTemplate.id = 'modal-variable-item-template';
    modalVariableItemTemplate.innerHTML = `
      <div class="modal-variable-item">
        <input
          type="text"
          class="modal-variable-name"
          data-bind-attr="namePlaceholder:placeholder,name:value">
        <input
          type="text"
          class="modal-variable-value"
          data-bind-attr="valuePlaceholder:placeholder,value:value">
        <button type="button" class="btn-danger modal-variable-remove">✖</button>
      </div>
    `;
    document.body.appendChild(modalVariableItemTemplate);

    // Setup DOM
    const modalHTML = `
      <div id="editModal" class="modal">
        <form id="editForm">
          <input id="editId" type="hidden" />
          <input id="editName" type="text" />
          <select id="editStatus">
            <option value="disabled">Disabled</option>
            <option value="enabled">Enabled</option>
            <option value="once">Once</option>
          </select>
          <select id="editEditable">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
          <input id="editStartUrl" type="text" />
          <div id="variablesList"></div>
        </form>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    editModal = document.getElementById('editModal') as HTMLDivElement;
    variablesList = document.getElementById('variablesList') as HTMLDivElement;

    editingId = null;

    modalManager = new ModalManager(
      () => editingId,
      (id) => {
        editingId = id;
      }
    );
  });

  afterEach(() => {
    // DOM is cleared at the start of each test in beforeEach
    // No cleanup needed here
  });

  describe('openAddModal', () => {
    it('should reset form and open modal', () => {
      modalManager.openAddModal();

      expect(editingId).toBeNull();
      expect((document.getElementById('editId') as HTMLInputElement).value).toBe('');
      expect((document.getElementById('editName') as HTMLInputElement).value).toBe('');
      expect((document.getElementById('editStatus') as HTMLSelectElement).value).toBe('once');
      expect((document.getElementById('editEditable') as HTMLSelectElement).value).toBe('true');
      expect((document.getElementById('editStartUrl') as HTMLInputElement).value).toBe('');
      expect(variablesList.innerHTML).toBe('');
      // Note: Modal visibility is now controlled by Alpine.js showModal state
    });
  });

  describe('openEditModal', () => {
    it('should populate form with website data', () => {
      modalManager.openEditModal(mockWebsite, mockAutomationVariables);

      expect(editingId).toBe('website_123');
      expect((document.getElementById('editId') as HTMLInputElement).value).toBe('website_123');
      expect((document.getElementById('editName') as HTMLInputElement).value).toBe('Test Website');
      expect((document.getElementById('editStatus') as HTMLSelectElement).value).toBe('enabled');
      expect((document.getElementById('editEditable') as HTMLSelectElement).value).toBe('true');
      expect((document.getElementById('editStartUrl') as HTMLInputElement).value).toBe(
        'https://example.com'
      );
      // Note: Modal visibility is now controlled by Alpine.js showModal state
    });

    it('should render variables correctly', () => {
      modalManager.openEditModal(mockWebsite, mockAutomationVariables);

      const variableItems = variablesList.querySelectorAll('.modal-variable-item');
      expect(variableItems.length).toBe(2);

      const firstItem = variableItems[0];
      const nameInput = firstItem.querySelector('.modal-variable-name') as HTMLInputElement;
      const valueInput = firstItem.querySelector('.modal-variable-value') as HTMLInputElement;

      expect(nameInput.value).toBe('username');
      expect(valueInput.value).toBe('testuser');
    });

    it('should handle empty startUrl', () => {
      const websiteWithoutUrl: WebsiteData = {
        ...mockWebsite,
        startUrl: undefined,
      };

      modalManager.openEditModal(websiteWithoutUrl, mockAutomationVariables);

      expect((document.getElementById('editStartUrl') as HTMLInputElement).value).toBe('');
    });

    it('should handle editable=false', () => {
      const nonEditableWebsite: WebsiteData = {
        ...mockWebsite,
        editable: false,
      };

      modalManager.openEditModal(nonEditableWebsite, mockAutomationVariables);

      expect((document.getElementById('editEditable') as HTMLSelectElement).value).toBe('false');
    });
  });

  describe('closeModal', () => {
    it('should close modal and reset form', () => {
      modalManager.openEditModal(mockWebsite, mockAutomationVariables);
      // Note: Modal visibility is now controlled by Alpine.js showModal state

      modalManager.closeModal();

      // Note: Modal visibility is now controlled by Alpine.js showModal state
      expect(editingId).toBeNull();
    });
  });

  describe('addVariableField', () => {
    it('should add empty variable field', () => {
      modalManager.addVariableField();

      const variableItems = variablesList.querySelectorAll('.modal-variable-item');
      expect(variableItems.length).toBe(1);

      const nameInput = variableItems[0].querySelector('.modal-variable-name') as HTMLInputElement;
      const valueInput = variableItems[0].querySelector(
        '.modal-variable-value'
      ) as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(valueInput.value).toBe('');
    });

    it('should add variable field with values', () => {
      modalManager.addVariableField('testName', 'testValue');

      const variableItems = variablesList.querySelectorAll('.modal-variable-item');
      expect(variableItems.length).toBe(1);

      const nameInput = variableItems[0].querySelector('.modal-variable-name') as HTMLInputElement;
      const valueInput = variableItems[0].querySelector(
        '.modal-variable-value'
      ) as HTMLInputElement;

      expect(nameInput.value).toBe('testName');
      expect(valueInput.value).toBe('testValue');
    });

    it('should allow removing variable field', () => {
      modalManager.addVariableField('testName', 'testValue');

      expect(variablesList.querySelectorAll('.modal-variable-item').length).toBe(1);

      const removeBtn = variablesList.querySelector('.btn-danger') as HTMLButtonElement;
      removeBtn.click();

      expect(variablesList.querySelectorAll('.modal-variable-item').length).toBe(0);
    });
  });

  describe('getFormData', () => {
    it('should collect form data correctly', () => {
      (document.getElementById('editName') as HTMLInputElement).value = 'New Website';
      (document.getElementById('editStatus') as HTMLSelectElement).value = 'once';
      (document.getElementById('editEditable') as HTMLSelectElement).value = 'false';
      (document.getElementById('editStartUrl') as HTMLInputElement).value = 'https://test.com';

      modalManager.addVariableField('var1', 'value1');
      modalManager.addVariableField('var2', 'value2');

      const formData = modalManager.getFormData();

      expect(formData.name).toBe('New Website');
      expect(formData.status).toBe('once');
      expect(formData.editable).toBe(false);
      expect(formData.startUrl).toBe('https://test.com');
      expect(formData.variables).toEqual({
        var1: 'value1',
        var2: 'value2',
      });
    });

    it('should trim whitespace from inputs', () => {
      (document.getElementById('editName') as HTMLInputElement).value = '  Trimmed  ';
      (document.getElementById('editStartUrl') as HTMLInputElement).value = '  https://test.com  ';

      const formData = modalManager.getFormData();

      expect(formData.name).toBe('Trimmed');
      expect(formData.startUrl).toBe('https://test.com');
    });

    it('should skip empty variable names', () => {
      modalManager.addVariableField('', 'value1');
      modalManager.addVariableField('var2', 'value2');

      const formData = modalManager.getFormData();

      expect(formData.variables).toEqual({
        var2: 'value2',
      });
    });
  });
});
