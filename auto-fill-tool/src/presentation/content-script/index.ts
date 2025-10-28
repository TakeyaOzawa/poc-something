/**
 * Content Script Entry Point
 * Pure DI layer - initializes MVP pattern components
 */

import { AutoFillOverlay } from './AutoFillOverlay';
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { LogLevel } from '@domain/types/logger.types';
import {
  RepositoryFactory,
  setGlobalFactory,
  getGlobalFactory,
} from '@infrastructure/factories/RepositoryFactory';
import { AutoFillToolContentScriptView } from './ContentScriptView';
import { AutoFillToolContentScriptPresenter } from './ContentScriptPresenter';
import { ContentScriptCoordinator } from './ContentScriptCoordinator';

// Initialize factory
const initializeFactory = (): RepositoryFactory => {
  try {
    return getGlobalFactory();
  } catch {
    const factory = new RepositoryFactory({
      mode: 'chrome', // TODO: Switch to secure mode when master password UI is implemented
    });
    setGlobalFactory(factory);
    return factory;
  }
};

const factory = initializeFactory();
const logger = new BackgroundLogger('ContentScript', LogLevel.INFO);

// State for right-click capture (used by XPath generation)
let lastRightClickedElement: Element | null = null;
let lastRightClickPosition = { x: 0, y: 0 };

// Context menu event listener (captures right-clicked element and position)
document.addEventListener(
  'contextmenu',
  (event) => {
    lastRightClickedElement = event.target as Element;
    lastRightClickPosition = { x: event.clientX, y: event.clientY };
  },
  true
);

// Initialize content script components
(async () => {
  try {
    // Load log level from settings
    const systemSettingsRepository = factory.createSystemSettingsRepository();
    const settingsResult = await systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const settings = settingsResult.value!;
    const logLevel = settings.getLogLevel();
    logger.setLevel(logLevel);
    logger.debug('Content script log level set from settings', { logLevel });

    // Initialize View (wraps AutoFillOverlay)
    const manualExecutionOverlay = new AutoFillOverlay();
    const view = new AutoFillToolContentScriptView(manualExecutionOverlay);

    // Initialize Presenter (business logic)
    const presenter = new AutoFillToolContentScriptPresenter({
      view,
      systemSettingsRepository,
      logger,
    });

    // Initialize Coordinator (orchestration)
    const coordinator = new ContentScriptCoordinator({
      presenter,
      logger,
      onGetXPath: () => lastRightClickedElement,
      onGetClickPosition: () => lastRightClickPosition,
    });

    // Start coordinator
    coordinator.initialize();

    logger.info('Content script initialized with MVP pattern');
  } catch (error) {
    console.error('[ContentScript] Failed to initialize:', error);
    logger.error('Content script initialization failed', error);
  }
})();
