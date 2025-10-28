/**
 * Domain Layer: Message Handler Interface
 * Interface for handling specific message types
 */

import browser from 'webextension-polyfill';
import { MessageRequest, MessageResponse } from './MessageContracts';

/**
 * Context for message handling
 * Provides sender information for handlers that need it
 */
export interface MessageContext {
  sender: browser.Runtime.MessageSender;
}

/**
 * Message handler interface
 * Handlers must implement this interface to process specific message types
 */
export interface MessageHandler<
  TRequest extends MessageRequest = MessageRequest,
  TResponse extends MessageResponse = MessageResponse,
> {
  /**
   * Handle a message request
   * @param message The message request
   * @param context The message context including sender information
   * @returns The response or a promise of the response
   */
  handle(message: TRequest, context: MessageContext): Promise<TResponse> | TResponse;
}

/**
 * Message handler registry
 * Maps message action types to their handlers
 */
export type MessageHandlerRegistry = Map<string, MessageHandler>;
