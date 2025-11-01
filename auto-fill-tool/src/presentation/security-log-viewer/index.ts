/**
 * Security Log Viewer Entry Point
 * セキュリティログビューアーのエントリーポイント
 */

interface SecurityLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  event: string;
  details: string;
}

class SecurityLogViewer {
  private logsContainer: HTMLElement;
  private filterSelect: HTMLSelectElement;
  private searchInput: HTMLInputElement;
  private logs: SecurityLogEntry[] = [];

  constructor() {
    this.logsContainer = document.getElementById('logs-container') || document.createElement('div');
    this.filterSelect = document.getElementById('level-filter') as HTMLSelectElement;
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    
    this.attachEventListeners();
    this.loadLogs();
  }

  private attachEventListeners(): void {
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', () => {
        this.renderLogs();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.renderLogs();
      });
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadLogs();
      });
    }

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearLogs();
      });
    }
  }

  private async loadLogs(): Promise<void> {
    try {
      // TODO: 実際のログ取得処理
      this.logs = [
        {
          id: '1',
          timestamp: Date.now() - 3600000,
          level: 'info',
          source: 'authentication',
          event: 'login_success',
          details: 'User successfully authenticated'
        },
        {
          id: '2',
          timestamp: Date.now() - 1800000,
          level: 'warning',
          source: 'automation',
          event: 'xpath_not_found',
          details: 'XPath element not found on page'
        },
        {
          id: '3',
          timestamp: Date.now() - 900000,
          level: 'error',
          source: 'storage',
          event: 'save_failed',
          details: 'Failed to save data to Chrome storage'
        }
      ];
      
      this.renderLogs();
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  private renderLogs(): void {
    const filteredLogs = this.getFilteredLogs();
    
    this.logsContainer.innerHTML = '';
    
    if (filteredLogs.length === 0) {
      this.logsContainer.innerHTML = '<p class="text-gray-500">ログがありません</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'w-full border-collapse border border-gray-300';
    
    table.innerHTML = `
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 px-4 py-2">時刻</th>
          <th class="border border-gray-300 px-4 py-2">レベル</th>
          <th class="border border-gray-300 px-4 py-2">ソース</th>
          <th class="border border-gray-300 px-4 py-2">イベント</th>
          <th class="border border-gray-300 px-4 py-2">詳細</th>
        </tr>
      </thead>
      <tbody>
        ${filteredLogs.map(log => `
          <tr class="${this.getRowClass(log.level)}">
            <td class="border border-gray-300 px-4 py-2">${new Date(log.timestamp).toLocaleString()}</td>
            <td class="border border-gray-300 px-4 py-2">${log.level}</td>
            <td class="border border-gray-300 px-4 py-2">${log.source}</td>
            <td class="border border-gray-300 px-4 py-2">${log.event}</td>
            <td class="border border-gray-300 px-4 py-2">${log.details}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    this.logsContainer.appendChild(table);
  }

  private getFilteredLogs(): SecurityLogEntry[] {
    let filtered = this.logs;

    // レベルフィルター
    const selectedLevel = this.filterSelect?.value;
    if (selectedLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // 検索フィルター
    const searchTerm = this.searchInput?.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.event.toLowerCase().includes(searchTerm) ||
        log.details.toLowerCase().includes(searchTerm) ||
        log.source.toLowerCase().includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getRowClass(level: string): string {
    switch (level) {
      case 'critical':
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return '';
    }
  }

  private async clearLogs(): Promise<void> {
    if (confirm('すべてのログを削除しますか？')) {
      try {
        // TODO: 実際のログクリア処理
        this.logs = [];
        this.renderLogs();
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new SecurityLogViewer();
});
