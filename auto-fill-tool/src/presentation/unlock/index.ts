/**
 * Unlock Screen Entry Point
 * Simplified to dependency injection only following MVP pattern
 * Business logic moved to UnlockPresenter, DOM operations to UnlockView
 */

import { UnlockView } from './UnlockView';
import { UnlockPresenter } from './UnlockPresenter';

/**
 * Initialize dependencies and start the application
 */
function initializeApp(): void {
  // Initialize View (handles DOM manipulation)
  const view = new UnlockView();

  // Initialize Presenter (handles business logic orchestration)
  const presenter = new UnlockPresenter({ view });

  // Start the application
  presenter.init();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
