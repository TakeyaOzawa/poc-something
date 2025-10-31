/**
 * Performance Dashboard JavaScript
 * Handles UI interactions and data display for performance monitoring
 */

class PerformanceDashboard {
  constructor() {
    this.initializeEventListeners();
    this.loadPerformanceData();

    // Auto-refresh every 5 seconds
    setInterval(() => this.loadPerformanceData(), 5000);
  }

  initializeEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadPerformanceData();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearPerformanceData();
    });
  }

  async loadPerformanceData() {
    try {
      // Send message to background script to get performance data
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PERFORMANCE_METRICS',
      });

      if (response && response.success) {
        this.updateDashboard(response.data);
      } else {
        console.error('Failed to load performance data:', response?.error);
        this.showError('パフォーマンスデータの読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
      this.showError('データの読み込み中にエラーが発生しました');
    }
  }

  async clearPerformanceData() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLEAR_PERFORMANCE_METRICS',
      });

      if (response && response.success) {
        this.loadPerformanceData(); // Refresh display
      } else {
        console.error('Failed to clear performance data:', response?.error);
        this.showError('パフォーマンスデータのクリアに失敗しました');
      }
    } catch (error) {
      console.error('Error clearing performance data:', error);
      this.showError('データのクリア中にエラーが発生しました');
    }
  }

  updateDashboard(data) {
    this.updateSummaryCards(data.summary);
    this.updateOperationMetrics(data.metrics);
    this.updateRecentOperations(data.recent);
  }

  updateSummaryCards(summary) {
    document.getElementById('totalOperations').textContent = summary.totalOperations || 0;
    document.getElementById('avgDuration').textContent = summary.avgDuration
      ? summary.avgDuration.toFixed(2)
      : '-';
    document.getElementById('slowOperations').textContent = summary.slowOperations || 0;
    document.getElementById('memoryUsage').textContent = summary.memoryUsage
      ? (summary.memoryUsage / (1024 * 1024)).toFixed(1)
      : '-';
  }

  updateOperationMetrics(metrics) {
    this.updateAutoFillMetrics(metrics.autoFill || []);
    this.updateStorageMetrics(metrics.storage || []);
  }

  updateAutoFillMetrics(autoFillMetrics) {
    const container = document.getElementById('autoFillMetrics');

    if (autoFillMetrics.length === 0) {
      container.innerHTML = '<div class="text-gray-500 text-center py-4">データがありません</div>';
      return;
    }

    const html = autoFillMetrics
      .map(
        (metric) => `
      <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
        <div>
          <div class="font-medium">${metric.operationName}</div>
          <div class="text-sm text-gray-500">${metric.count} operations</div>
        </div>
        <div class="text-right">
          <div class="font-bold ${metric.avgDuration > 1000 ? 'text-red-600' : 'text-green-600'}">
            ${metric.avgDuration.toFixed(2)}ms
          </div>
          <div class="text-sm text-gray-500">avg</div>
        </div>
      </div>
    `
      )
      .join('');

    container.innerHTML = html;
  }

  updateStorageMetrics(storageMetrics) {
    const container = document.getElementById('storageMetrics');

    if (storageMetrics.length === 0) {
      container.innerHTML = '<div class="text-gray-500 text-center py-4">データがありません</div>';
      return;
    }

    const html = storageMetrics
      .map(
        (metric) => `
      <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
        <div>
          <div class="font-medium">${metric.operationName}</div>
          <div class="text-sm text-gray-500">${metric.count} operations</div>
        </div>
        <div class="text-right">
          <div class="font-bold ${metric.avgDuration > 100 ? 'text-yellow-600' : 'text-green-600'}">
            ${metric.avgDuration.toFixed(2)}ms
          </div>
          <div class="text-sm text-gray-500">avg</div>
        </div>
      </div>
    `
      )
      .join('');

    container.innerHTML = html;
  }

  updateRecentOperations(recentOperations) {
    const tbody = document.getElementById('recentOperations');

    if (!recentOperations || recentOperations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-gray-500">
            最近の操作がありません
          </td>
        </tr>
      `;
      return;
    }

    const html = recentOperations
      .map(
        (operation) => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${operation.operationName}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm ${operation.duration > 1000 ? 'text-red-600' : 'text-gray-900'}">
            ${operation.duration.toFixed(2)}ms
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">
            ${operation.memoryUsage ? (operation.memoryUsage / (1024 * 1024)).toFixed(1) + 'MB' : '-'}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            operation.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }">
            ${operation.success ? '成功' : '失敗'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${new Date(operation.endTime).toLocaleTimeString()}
        </td>
      </tr>
    `
      )
      .join('');

    tbody.innerHTML = html;
  }

  showError(message) {
    // Simple error display - could be enhanced with a proper notification system
    const errorDiv = document.createElement('div');
    errorDiv.className =
      'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PerformanceDashboard();
});
