/**
 * Security Log Viewer Entry Point
 * Initializes the log viewer UI
 */

import { ChromeStorageLogAggregatorPort } from '@/infrastructure/adapters/ChromeStorageLogAggregatorAdapter';
import { SecurityLogViewerPresenter } from './SecurityLogViewerPresenter';
import { SecurityLogViewerView } from './SecurityLogViewerView';

/**
 * Initialize the Security Log Viewer
 */
async function initializeSecurityLogViewer(): Promise<void> {
  try {
    // Create adapter instance
    const logAggregatorService = new ChromeStorageLogAggregatorPort();

    // Create presenter
    const presenter = new SecurityLogViewerPresenter(logAggregatorService);

    // Initialize presenter
    await presenter.initialize();

    // Create and initialize view
    const view = new SecurityLogViewerView(presenter);
    await view.initialize();

    // Expose showLogDetails to window for onclick handlers
    (window as any).showLogDetails = (logId: string) => {
      view.showLogDetails(logId);
    };

    console.log('Security Log Viewer initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Security Log Viewer:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSecurityLogViewer();
  });
} else {
  initializeSecurityLogViewer();
}
