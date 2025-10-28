/**
 * Master Password Setup Screen - Entry Point
 * Simplified to dependency injection only
 * Follows MVP (Model-View-Presenter) pattern
 */

import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { LogLevel } from '@domain/types/logger.types';
import { MasterPasswordSetupPresenter } from './MasterPasswordSetupPresenter';
import { MasterPasswordSetupView } from './MasterPasswordSetupView';

/**
 * Initialize dependencies and start the application
 */
function initializeApp(): void {
  // Initialize logger
  const logger = new BackgroundLogger('MasterPasswordSetup', LogLevel.INFO);

  // Initialize View (handles DOM manipulation)
  const view = new MasterPasswordSetupView();

  // Initialize Presenter (handles business logic orchestration)
  const presenter = new MasterPasswordSetupPresenter({
    view,
    logger,
  });

  // Start the application
  presenter.init();

  logger.info('Master Password Setup initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
