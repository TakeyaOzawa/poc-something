/**
 * Infrastructure Layer: Message Dispatcher
 * Type-safe message sending helper for Chrome extension messaging
 */

import browser from 'webextension-polyfill';
import { MessageTypes } from '@domain/types/messaging';
import {
  MessageTypeMap,
  ExecuteAutoFillRequest,
  ExecuteAutoFillResponse,
  ExecuteWebsiteFromPopupRequest,
  ExecuteWebsiteFromPopupResponse,
  GetXPathRequest,
  GetXPathResponse,
  ShowXPathDialogRequest,
  ShowXPathDialogResponse,
} from '@domain/types/messaging';

/**
 * Message Dispatcher
 * Provides type-safe methods for sending messages
 */
export class MessageDispatcher {
  /**
   * Send message to background script
   */
  async sendToBackground<T extends keyof MessageTypeMap>(
    message: MessageTypeMap[T]['request']
  ): Promise<MessageTypeMap[T]['response']> {
    return (await browser.runtime.sendMessage(message)) as MessageTypeMap[T]['response'];
  }

  /**
   * Send message to a specific tab
   */
  async sendToTab<T extends keyof MessageTypeMap>(
    tabId: number,
    message: MessageTypeMap[T]['request']
  ): Promise<MessageTypeMap[T]['response']> {
    return (await browser.tabs.sendMessage(tabId, message)) as MessageTypeMap[T]['response'];
  }

  // ============================================================================
  // Convenience methods for specific message types
  // ============================================================================

  /**
   * Send executeAutoFill message to background
   */
  async executeAutoFill(params: {
    tabId?: number | null;
    websiteId: string;
    websiteVariables: Record<string, string>;
  }): Promise<ExecuteAutoFillResponse> {
    const message: ExecuteAutoFillRequest = {
      action: MessageTypes.EXECUTE_AUTO_FILL,
      tabId: params.tabId,
      websiteId: params.websiteId,
      websiteVariables: params.websiteVariables,
    };
    return await this.sendToBackground(message);
  }

  /**
   * Send executeWebsiteFromPopup message to background
   */
  async executeWebsiteFromPopup(websiteId: string): Promise<ExecuteWebsiteFromPopupResponse> {
    const message: ExecuteWebsiteFromPopupRequest = {
      action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
      websiteId,
    };
    return await this.sendToBackground(message);
  }

  /**
   * Send getXPath message to content script
   */
  async getXPath(tabId: number): Promise<GetXPathResponse> {
    const message: GetXPathRequest = {
      action: MessageTypes.GET_XPATH,
    };
    return await this.sendToTab(tabId, message);
  }

  /**
   * Send showXPathDialog message to content script
   */
  async showXPathDialog(
    tabId: number,
    xpathInfo: {
      smart: string | null;
      short: string | null;
      absolute: string | null;
      elementInfo: {
        tagName: string;
        text: string;
      };
    }
  ): Promise<ShowXPathDialogResponse> {
    const message: ShowXPathDialogRequest = {
      action: MessageTypes.SHOW_XPATH_DIALOG,
      xpathInfo,
    };
    return await this.sendToTab(tabId, message);
  }
}
