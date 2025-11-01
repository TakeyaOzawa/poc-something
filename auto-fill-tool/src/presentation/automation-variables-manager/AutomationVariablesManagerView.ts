/**
 * AutomationVariablesManagerView
 * 自動化変数管理画面のView層
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { IAutomationVariablesManagerView } from './AutomationVariablesManagerPresenter';

export class AutomationVariablesManagerView implements IAutomationVariablesManagerView {
  private variablesContainer: HTMLElement;
  private loadingIndicator: HTMLElement;
  private messageContainer: HTMLElement;

  constructor() {
    this.variablesContainer = document.getElementById('variables-container') || document.createElement('div');
    this.loadingIndicator = document.getElementById('loading-indicator') || document.createElement('div');
    this.messageContainer = document.getElementById('message-container') || document.createElement('div');
  }

  showVariables(variables: AutomationVariables[]): void {
    this.variablesContainer.innerHTML = '';
    
    if (variables.length === 0) {
      this.variablesContainer.innerHTML = '<p class="text-gray-500">自動化変数がありません</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'w-full border-collapse border border-gray-300';
    
    // ヘッダー
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr class="bg-gray-100">
        <th class="border border-gray-300 px-4 py-2">ID</th>
        <th class="border border-gray-300 px-4 py-2">WebsiteID</th>
        <th class="border border-gray-300 px-4 py-2">変数数</th>
        <th class="border border-gray-300 px-4 py-2">作成日時</th>
        <th class="border border-gray-300 px-4 py-2">操作</th>
      </tr>
    `;
    table.appendChild(thead);

    // ボディ
    const tbody = document.createElement('tbody');
    variables.forEach(variable => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="border border-gray-300 px-4 py-2 text-sm">${variable.getId()}</td>
        <td class="border border-gray-300 px-4 py-2">${variable.getWebsiteId()}</td>
        <td class="border border-gray-300 px-4 py-2">${variable.getVariables().length}</td>
        <td class="border border-gray-300 px-4 py-2">${new Date(variable.getCreatedAt()).toLocaleString()}</td>
        <td class="border border-gray-300 px-4 py-2">
          <button class="btn-secondary mr-2" onclick="editVariables('${variable.getId()}')">編集</button>
          <button class="btn-danger" onclick="deleteVariables('${variable.getId()}')">削除</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    this.variablesContainer.appendChild(table);
  }

  showError(message: string): void {
    this.showMessage(message, 'error');
  }

  showSuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  showLoading(isLoading: boolean): void {
    this.loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.messageContainer.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-4 mb-4 rounded ${
      type === 'success' 
        ? 'bg-green-100 border border-green-400 text-green-700' 
        : 'bg-red-100 border border-red-400 text-red-700'
    }`;
    messageDiv.textContent = message;
    
    this.messageContainer.appendChild(messageDiv);
    
    // 3秒後に自動で消す
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }
}
