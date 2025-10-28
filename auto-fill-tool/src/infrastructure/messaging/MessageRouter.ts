/**
 * Infrastructure Layer: Message Router
 * Routes incoming messages to appropriate handlers
 */

import browser from 'webextension-polyfill';
import { MessageHandler, MessageHandlerRegistry, MessageContext } from '@domain/types/messaging';
import {
  MessageRequest,
  MessageResponse,
  BaseResponse,
  BaseMessage,
} from '@domain/types/messaging';
import { isValidMessageType, MessageTypes } from '@domain/types/messaging';
import { Logger } from '@domain/types/logger.types';

/**
 * Message Router
 * Handles message routing and error handling
 */
export class MessageRouter {
  private handlers: MessageHandlerRegistry;
  private ignoredActions: string[];

  constructor(private logger?: Logger) {
    this.handlers = new Map();
    // Internal messages that should not be routed through this router
    // These are handled by dedicated listeners in specific contexts
    this.ignoredActions = [
      MessageTypes.UPDATE_AUTO_FILL_PROGRESS,
      MessageTypes.FORWARD_LOG,
      // Recording messages are handled by ContentScriptMediaRecorder and ContentScriptTabCaptureAdapter
      MessageTypes.START_RECORDING,
      MessageTypes.STOP_RECORDING,
      MessageTypes.RECORDING_STARTED,
      MessageTypes.RECORDING_STOPPED,
      MessageTypes.RECORDING_ERROR,
      // Background service message handlers (handled in background/index.ts)
      MessageTypes.INITIALIZE_MASTER_PASSWORD,
      MessageTypes.UNLOCK_STORAGE,
      MessageTypes.LOCK_STORAGE,
      MessageTypes.CHECK_UNLOCK_STATUS,
      MessageTypes.CHECK_STORAGE_STATUS,
      MessageTypes.EXECUTE_MANUAL_SYNC,
      MessageTypes.EXECUTE_ALL_SYNCS,
      MessageTypes.RESUME_AUTO_FILL,
      MessageTypes.GET_CURRENT_TAB_ID,
    ];
  }

  /**
   * Register a message handler for a specific action type
   */
  registerHandler(actionType: string, handler: MessageHandler): void {
    this.handlers.set(actionType, handler);
    this.logger?.debug(`Registered handler for action: ${actionType}`);
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(actionType: string): void {
    this.handlers.delete(actionType);
    this.logger?.debug(`Unregistered handler for action: ${actionType}`);
  }

  /**
   * Start listening for messages
   * Should be called once during initialization
   */
  startListening(): void {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const action = (message as BaseMessage)?.action;
      this.logger?.debug('Message received in router', {
        action,
        hasHandler: action ? this.handlers.has(action) : false,
      });
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });
    this.logger?.info('Message router started listening');
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(
    message: unknown,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): Promise<void> {
    try {
      // Validate message structure (type guard)
      if (!this.isValidMessageStructure(message)) {
        this.logger?.warn('Invalid message received', { message });
        sendResponse(this.createErrorResponse('Invalid message format'));
        return;
      }

      // Ignore internal messages that are handled by other listeners
      if (this.ignoredActions.includes(message.action)) {
        this.logger?.debug('Ignoring internal message', { action: message.action });
        return;
      }

      // Validate action type
      if (!isValidMessageType(message.action)) {
        this.logger?.warn('Unknown action type', { action: message.action });
        sendResponse(this.createErrorResponse('Unknown action type'));
        return;
      }

      // Get handler for action
      const handler = this.handlers.get(message.action);
      if (!handler) {
        this.logger?.warn('No handler registered for action', { action: message.action });
        sendResponse(this.createErrorResponse('No handler for this action'));
        return;
      }

      // Create context
      const context: MessageContext = { sender };

      // Execute handler
      this.logger?.debug('Handling message', { action: message.action });
      const response = await handler.handle(message as MessageRequest, context);
      sendResponse(response);
    } catch (error) {
      this.logger?.error('Error handling message', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse(this.createErrorResponse(errorMessage));
    }
  }

  /**
   * Type guard to validate message structure
   */
  private isValidMessageStructure(message: unknown): message is BaseMessage {
    return (
      message !== null &&
      typeof message === 'object' &&
      'action' in message &&
      typeof (message as BaseMessage).action === 'string'
    );
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: string): BaseResponse {
    return {
      success: false,
      error,
    };
  }
}
