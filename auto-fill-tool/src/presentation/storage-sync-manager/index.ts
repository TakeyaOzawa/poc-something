/**
 * Storage Sync Manager Entry Point
 * ストレージ同期マネージャーのエントリーポイント
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';

class StorageSyncManager {
  private configsContainer: HTMLElement;
  private syncConfigs: StorageSyncConfig[] = [];

  constructor() {
    this.configsContainer = document.getElementById('configs-container') || document.createElement('div');
    
    this.attachEventListeners();
    this.loadConfigs();
  }

  private attachEventListeners(): void {
    const addBtn = document.getElementById('add-config-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddConfigModal();
      });
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadConfigs();
      });
    }
  }

  private async loadConfigs(): Promise<void> {
    try {
      // TODO: 実際の同期設定取得処理
      this.syncConfigs = [];
      this.renderConfigs();
    } catch (error) {
      console.error('Failed to load sync configs:', error);
    }
  }

  private renderConfigs(): void {
    this.configsContainer.innerHTML = '';
    
    if (this.syncConfigs.length === 0) {
      this.configsContainer.innerHTML = '<p class="text-gray-500">同期設定がありません</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'w-full border-collapse border border-gray-300';
    
    table.innerHTML = `
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 px-4 py-2">ストレージキー</th>
          <th class="border border-gray-300 px-4 py-2">同期方法</th>
          <th class="border border-gray-300 px-4 py-2">同期タイミング</th>
          <th class="border border-gray-300 px-4 py-2">同期方向</th>
          <th class="border border-gray-300 px-4 py-2">状態</th>
          <th class="border border-gray-300 px-4 py-2">操作</th>
        </tr>
      </thead>
      <tbody>
        ${this.syncConfigs.map(config => `
          <tr>
            <td class="border border-gray-300 px-4 py-2">${config.getStorageKey()}</td>
            <td class="border border-gray-300 px-4 py-2">${config.getSyncMethod()}</td>
            <td class="border border-gray-300 px-4 py-2">${config.getSyncTiming()}</td>
            <td class="border border-gray-300 px-4 py-2">${config.getSyncDirection()}</td>
            <td class="border border-gray-300 px-4 py-2">
              <span class="px-2 py-1 rounded text-sm ${config.isEnabled() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${config.isEnabled() ? '有効' : '無効'}
              </span>
            </td>
            <td class="border border-gray-300 px-4 py-2">
              <button class="btn-secondary mr-2" onclick="editConfig('${config.getId()}')">編集</button>
              <button class="btn-primary mr-2" onclick="executeSync('${config.getId()}')">同期実行</button>
              <button class="btn-danger" onclick="deleteConfig('${config.getId()}')">削除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    this.configsContainer.appendChild(table);
  }

  private showAddConfigModal(): void {
    // TODO: 同期設定追加モーダルの実装
    console.log('Show add config modal');
  }

  public async editConfig(id: string): Promise<void> {
    // TODO: 同期設定編集処理
    console.log('Edit config:', id);
  }

  public async executeSync(id: string): Promise<void> {
    try {
      // TODO: 同期実行処理
      console.log('Execute sync:', id);
    } catch (error) {
      console.error('Failed to execute sync:', error);
    }
  }

  public async deleteConfig(id: string): Promise<void> {
    if (confirm('この同期設定を削除しますか？')) {
      try {
        // TODO: 同期設定削除処理
        console.log('Delete config:', id);
        await this.loadConfigs();
      } catch (error) {
        console.error('Failed to delete config:', error);
      }
    }
  }
}

// グローバル関数
let syncManager: StorageSyncManager;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).editConfig = (id: string) => syncManager.editConfig(id);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).executeSync = (id: string) => syncManager.executeSync(id);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).deleteConfig = (id: string) => syncManager.deleteConfig(id);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  syncManager = new StorageSyncManager();
});
