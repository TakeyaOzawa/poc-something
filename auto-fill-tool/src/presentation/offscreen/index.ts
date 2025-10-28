/**
 * Offscreen Document Entry Point
 * Handles tab capture and media recording in an offscreen context
 * Simplified to dependency injection only
 * Follows MVP (Model-View-Presenter) pattern
 */

import { OffscreenView } from './OffscreenView';
import { OffscreenPresenter } from './OffscreenPresenter';

/**
 * Initialize dependencies and start the application
 */
function initializeApp(): void {
  console.log('[Offscreen] Offscreen document loaded');

  // Initialize View (handles MediaRecorder API)
  const view = new OffscreenView();

  // Initialize Presenter (handles message routing and state management)
  const presenter = new OffscreenPresenter({ view });

  // Start the application
  presenter.init();
}

// Initialize immediately (offscreen document has no DOM)
initializeApp();
