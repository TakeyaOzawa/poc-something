/**
 * Presentation Layer: Popup UI
 * Entry point for the Auto Fill Tool popup
 * Refactored with DI Container pattern
 */

import browser from 'webextension-polyfill';
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { LogLevel, Logger } from '@domain/types/logger.types';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { MessageTypes } from '@domain/types/messaging';
import { ModalManager } from './ModalManager';
import { WebsiteActionHandler } from './WebsiteActionHandler';
import { WebsiteListPresenter } from './WebsiteListPresenter';
import { PopupCoordinator } from './PopupCoordinator';
import { container } from '@infrastructure/di/GlobalContainer';
import { TOKENS } from '@infrastructure/di/ServiceTokens';

/**
 * Initialize popup components with DI Container
 */
async function initializePopup(): Promise<void> {
  // Apply localization
  I18nAdapter.applyToDOM();

  // Initialize logger
  const logger = new BackgroundLogger('Popup', LogLevel.INFO);

  try {
    // Load system settings to configure log level
    const systemSettingsUseCase = container.resolve(TOKENS.GET_SYSTEM_SETTINGS_USE_CASE);
    const settingsResult = await systemSettingsUseCase.execute();

    if (settingsResult.isSuccess) {
      const settings = settingsResult.value!;
      logger.setLevel(settings.logLevel);
      logger.debug('Popup log level set from settings', { logLevel: settings.logLevel });
    }

    // Create a placeholder for circular dependency resolution
    const websiteListPresenter: WebsiteListPresenter = (() => {
      // Initialize modal manager with getter/setter functions
      const modalManager = new ModalManager(
        () => websiteListPresenter?.editingId || null,
        (id) => {
          if (websiteListPresenter) {
            websiteListPresenter.editingId = id;
          }
        }
      );

      // Initialize action handler
      const actionHandler = new WebsiteActionHandler(logger.createChild('ActionHandler'));

      // Initialize website list presenter with DI
      return new WebsiteListPresenter(modalManager, actionHandler);
    })();

    // Initialize coordinator
    const coordinator = new PopupCoordinator(websiteListPresenter, logger);

    // Start the application
    await coordinator.initialize();

    logger.info('Popup initialized successfully with DI Container');
  } catch (error) {
    logger.error('Failed to initialize popup', error);

    // Show error message to user
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = I18nAdapter.getMessage('popupInitializationFailed');
      errorElement.style.display = 'block';
    }
  }
}

/**
 * Handle sync all data request
 */
async function handleSyncAllData(): Promise<void> {
  const logger = container.resolve<Logger>(TOKENS.LOGGER);

  try {
    logger.info('Starting sync all data operation');

    // Send message to background script
    const response = await browser.runtime.sendMessage({
      type: MessageTypes.EXECUTE_ALL_SYNCS,
    });

    if (response?.success) {
      logger.info('Sync all data completed successfully');
    } else {
      logger.error('Sync all data failed', response?.error);
    }
  } catch (error) {
    logger.error('Failed to execute sync all data', error);
  }
}

/**
 * Handle navigation to data sync settings
 */
function openDataSyncSettings(): void {
  const url = browser.runtime.getURL('system-settings.html#data-sync');
  browser.tabs.create({ url });
}

/**
 * Setup global event handlers
 */
function setupGlobalHandlers(): void {
  // Handle sync all data button
  const syncAllButton = document.getElementById('syncAllData');
  if (syncAllButton) {
    syncAllButton.addEventListener('click', handleSyncAllData);
  }

  // Handle data sync settings button
  const dataSyncButton = document.getElementById('dataSyncSettings');
  if (dataSyncButton) {
    dataSyncButton.addEventListener('click', openDataSyncSettings);
  }
}

/**
 * Main entry point
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupGlobalHandlers();
  await initializePopup();
});

// Handle browser action (popup open)
if (typeof browser !== 'undefined' && browser.action) {
  browser.action.onClicked.addListener(() => {
    // This is handled by the manifest popup configuration
  });
}
