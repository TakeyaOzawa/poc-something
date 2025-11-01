/**
 * XPathManagerView
 * XPath管理画面のView層（DOM操作）
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { WebsiteData } from '@domain/entities/Website';
import { IXPathManagerView } from './XPathManagerPresenter';

export class XPathManagerView implements IXPathManagerView {
  private xpathsContainer: HTMLElement;
  private websitesSelect: HTMLSelectElement;
  private loadingIndicator: HTMLElement;
  private messageContainer: HTMLElement;

  constructor() {
    this.xpathsContainer = document.getElementById('xpaths-container') || document.createElement('div');
    this.websitesSelect = document.getElementById('websites-select') as HTMLSelectElement || document.createElement('select');
    this.loadingIndicator = document.getElementById('loading-indicator') || document.createElement('div');
    this.messageContainer = document.getElementById('message-container') || document.createElement('div');
  }

  showXPaths(xpaths: XPathData[]): void {
    this.xpathsContainer.innerHTML = '';
    
    if (xpaths.length === 0) {
      this.xpathsContainer.innerHTML = '<p class="text-gray-500">XPath設定がありません</p>';
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
        <th class="border border-gray-300 px-4 py-2">URL</th>
        <th class="border border-gray-300 px-4 py-2">Action</th>
        <th class="border border-gray-300 px-4 py-2">Value</th>
        <th class="border border-gray-300 px-4 py-2">Order</th>
        <th class="border border-gray-300 px-4 py-2">操作</th>
      </tr>
    `;
    table.appendChild(thead);

    // ボディ
    const tbody = document.createElement('tbody');
    xpaths.forEach(xpath => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="border border-gray-300 px-4 py-2 text-sm">${xpath.id}</td>
        <td class="border border-gray-300 px-4 py-2">${xpath.websiteId}</td>
        <td class="border border-gray-300 px-4 py-2 max-w-xs truncate" title="${xpath.url}">${xpath.url}</td>
        <td class="border border-gray-300 px-4 py-2">${xpath.actionType}</td>
        <td class="border border-gray-300 px-4 py-2 max-w-xs truncate" title="${xpath.value}">${xpath.value}</td>
        <td class="border border-gray-300 px-4 py-2">${xpath.executionOrder}</td>
        <td class="border border-gray-300 px-4 py-2">
          <button class="btn-secondary mr-2" onclick="editXPath('${xpath.id}')">編集</button>
          <button class="btn-danger" onclick="deleteXPath('${xpath.id}')">削除</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    this.xpathsContainer.appendChild(table);
  }

  showWebsites(websites: WebsiteData[]): void {
    this.websitesSelect.innerHTML = '<option value="">Webサイトを選択</option>';
    
    websites.forEach(website => {
      const option = document.createElement('option');
      option.value = website.id;
      option.textContent = website.name;
      this.websitesSelect.appendChild(option);
    });
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
