/**
 * Content Script Coordinator Implementation
 * Orchestrates content script components initialization
 */

import browser from 'webextension-polyfill';
import { AutoFillHandler } from './AutoFillHandler';
import { MessageRouter } from '@infrastructure/messaging/MessageRouter';
import { MessageTypes } from '@domain/types/messaging';
import { GetXPathHandler } from './handlers/GetXPathHandler';
import { ShowXPathDialogHandler } from './handlers/ShowXPathDialogHandler';
import { UpdateAutoFillProgressMessage } from '@domain/types/messaging';
import { BrowserXPathGenerationAdapter } from '@infrastructure/adapters/BrowserXPathGenerationAdapter';
import { ContentScriptMediaRecorder } from './ContentScriptMediaRecorder';
import type { ContentScriptCoordinatorDependencies } from '../types/content-script.types';
import type { Logger } from '@domain/types/logger.types';
import type { ContentScriptPresenter } from '../types/content-script.types';

/**
 * ContentScriptCoordinator - Coordinator layer for content script
 *
 * Responsibilities:
 * - Initialize AutoFillHandler for page load auto-fill
 * - Initialize MessageRouter with XPath and dialog handlers
 * - Register contextmenu event listener
 * - Register browser.runtime.onMessage listener for progress updates
 * - Initialize ContentScriptMediaRecorder
 * - Coordinate presenter progress updates
 */
export class ContentScriptCoordinator {
  private readonly presenter: ContentScriptPresenter;
  private readonly logger: Logger;
  private readonly onGetXPath: () => Element | null;
  private readonly onGetClickPosition: () => { x: number; y: number };

  private autoFillHandler: AutoFillHandler | null = null;
  private messageRouter: MessageRouter | null = null;

  constructor(dependencies: ContentScriptCoordinatorDependencies) {
    this.presenter = dependencies.presenter;
    this.logger = dependencies.logger;
    this.onGetXPath = dependencies.onGetXPath;
    this.onGetClickPosition = dependencies.onGetClickPosition;
  }

  /**
   * Initialize the coordinator
   * Main entry point called from index.ts
   */
  public initialize(): void {
    try {
      // Initialize auto-fill handler for page load
      this.initializeAutoFillHandler();

      // Initialize message router with XPath and dialog handlers
      this.initializeMessageRouter();

      // Register contextmenu event listener
      this.registerContextMenuListener();

      // Register progress update listener
      this.registerProgressUpdateListener();

      // Initialize media recorder
      this.initializeMediaRecorder();

      this.logger.info('Content script coordinator initialized');
    } catch (error) {
      this.logger.error('Failed to initialize content script coordinator', error);
      throw error;
    }
  }

  /**
   * Initialize AutoFillHandler for page load auto-fill
   */
  private initializeAutoFillHandler(): void {
    this.autoFillHandler = new AutoFillHandler(this.logger);
    this.autoFillHandler.handlePageLoad();

    this.logger.debug('AutoFillHandler initialized');
  }

  /**
   * Initialize MessageRouter with XPath and dialog handlers
   */
  private initializeMessageRouter(): void {
    this.messageRouter = new MessageRouter(this.logger.createChild('MessageRouter'));

    // Initialize XPath generation service
    const xpathService = new BrowserXPathGenerationAdapter();

    // Register GET_XPATH handler
    this.messageRouter.registerHandler(
      MessageTypes.GET_XPATH,
      new GetXPathHandler(this.onGetXPath, xpathService)
    );

    // Register SHOW_XPATH_DIALOG handler
    this.messageRouter.registerHandler(
      MessageTypes.SHOW_XPATH_DIALOG,
      new ShowXPathDialogHandler(this.onGetClickPosition)
    );

    // Start listening for messages
    this.messageRouter.startListening();

    this.logger.debug('MessageRouter initialized with XPath and dialog handlers');
  }

  /**
   * Register contextmenu event listener
   * Captures right-clicked element and position for XPath generation
   */
  private registerContextMenuListener(): void {
    document.addEventListener(
      'contextmenu',
      (event) => {
        // The onGetXPath and onGetClickPosition callbacks will be used by handlers
        // to retrieve the captured element and position
        this.logger.debug('Context menu event captured', {
          target: (event.target as Element)?.tagName,
          x: event.clientX,
          y: event.clientY,
        });
      },
      true
    );

    this.logger.debug('Context menu listener registered');
  }

  /**
   * Register browser.runtime.onMessage listener for progress updates
   * This listener is registered AFTER MessageRouter to avoid interfering with other messages
   */
  private registerProgressUpdateListener(): void {
    browser.runtime.onMessage.addListener((message: unknown) => {
      // Type guard for UpdateAutoFillProgressMessage
      if (
        message &&
        typeof message === 'object' &&
        'action' in message &&
        message.action === MessageTypes.UPDATE_AUTO_FILL_PROGRESS
      ) {
        const progressMessage = message as UpdateAutoFillProgressMessage;

        // Handle asynchronously without blocking other listeners
        this.handleProgressUpdate(
          progressMessage.current,
          progressMessage.total,
          progressMessage.description
        );
      }

      // Don't return anything - this message doesn't require a response
    });

    this.logger.debug('Progress update listener registered');
  }

  /**
   * Handle progress update from background script
   * Delegates to presenter for business logic
   */
  private handleProgressUpdate(current: number, total: number, description?: string): void {
    // Handle asynchronously to avoid blocking browser.runtime.onMessage
    this.presenter.handleProgressUpdate(current, total, description).catch((error) => {
      this.logger.error('Failed to handle progress update', error);
    });
  }

  /**
   * Initialize ContentScriptMediaRecorder for tab recording
   */
  private initializeMediaRecorder(): void {
    new ContentScriptMediaRecorder();
    this.logger.debug('ContentScriptMediaRecorder initialized');
  }

  /**
   * Cleanup resources
   * Called when content script is unloaded
   */
  public cleanup(): void {
    this.presenter.cleanup();
  }
}
