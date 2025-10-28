/**
 * Domain Layer: Message Definitions
 * Type-safe request and response definitions for all message types
 */

import { MessageTypes } from './MessageTypes';

/**
 * Base message structure
 */
export interface BaseMessage {
  action: string;
}

/**
 * Base response structure
 */
export interface BaseResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// Execute Auto Fill Messages
// ============================================================================

export interface ExecuteAutoFillRequest extends BaseMessage {
  action: typeof MessageTypes.EXECUTE_AUTO_FILL;
  tabId?: number | null;
  websiteId: string;
  websiteVariables: Record<string, string>;
}

export interface ExecuteAutoFillResponse extends BaseResponse {
  data?: {
    processedSteps?: number;
    error?: string;
  };
}

// ============================================================================
// Cancel Auto Fill Messages
// ============================================================================

export interface CancelAutoFillRequest extends BaseMessage {
  action: typeof MessageTypes.CANCEL_AUTO_FILL;
  tabId?: number | null;
}

export interface CancelAutoFillResponse extends BaseResponse {
  // No additional fields needed
}

// ============================================================================
// Execute Website From Popup Messages
// ============================================================================

export interface ExecuteWebsiteFromPopupRequest extends BaseMessage {
  action: typeof MessageTypes.EXECUTE_WEBSITE_FROM_POPUP;
  websiteId: string;
}

export interface ExecuteWebsiteFromPopupResponse extends BaseResponse {
  data?: {
    processedSteps?: number;
    error?: string;
  };
}

// ============================================================================
// Get XPath Messages
// ============================================================================

export interface GetXPathRequest extends BaseMessage {
  action: typeof MessageTypes.GET_XPATH;
}

export interface GetXPathResponse extends BaseResponse {
  xpaths?: {
    mixed: string | null;
    absolute: string | null;
    smart: string | null;
  };
  elementInfo?: {
    tagName: string;
    text: string;
  };
}

// ============================================================================
// Show XPath Dialog Messages
// ============================================================================

export interface ShowXPathDialogRequest extends BaseMessage {
  action: typeof MessageTypes.SHOW_XPATH_DIALOG;
  xpathInfo: {
    smart: string | null;
    short: string | null;
    absolute: string | null;
    elementInfo: {
      tagName: string;
      text: string;
    };
  };
}

export interface ShowXPathDialogResponse extends BaseResponse {
  // No additional fields needed
}

// ============================================================================
// Internal Messages (not routed through MessageRouter)
// ============================================================================

/**
 * Progress update message
 * Sent from background to content script during auto-fill execution
 */
export interface UpdateAutoFillProgressMessage extends BaseMessage {
  action: typeof MessageTypes.UPDATE_AUTO_FILL_PROGRESS;
  current: number;
  total: number;
  description?: string;
}

/**
 * Log forwarding message
 * Sent from popup/content scripts to background for centralized logging
 */
export interface ForwardLogMessage extends BaseMessage {
  action: typeof MessageTypes.FORWARD_LOG;
  level: string;
  context: string;
  message: string;
  logContext?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
  timestamp: number;
}

// ============================================================================
// Message Union Types
// ============================================================================

/**
 * Union type of all request messages (routed through MessageRouter)
 */
export type MessageRequest =
  | ExecuteAutoFillRequest
  | CancelAutoFillRequest
  | ExecuteWebsiteFromPopupRequest
  | GetXPathRequest
  | ShowXPathDialogRequest;

/**
 * Union type of internal messages (not routed through MessageRouter)
 */
export type InternalMessage = UpdateAutoFillProgressMessage | ForwardLogMessage;

/**
 * Union type of all messages (both routed and internal)
 */
export type AnyMessage = MessageRequest | InternalMessage;

/**
 * Union type of all response messages
 */
export type MessageResponse =
  | ExecuteAutoFillResponse
  | CancelAutoFillResponse
  | ExecuteWebsiteFromPopupResponse
  | GetXPathResponse
  | ShowXPathDialogResponse;

/**
 * Message type mapping for type-safe responses
 */
export type MessageTypeMap = {
  [MessageTypes.EXECUTE_AUTO_FILL]: {
    request: ExecuteAutoFillRequest;
    response: ExecuteAutoFillResponse;
  };
  [MessageTypes.CANCEL_AUTO_FILL]: {
    request: CancelAutoFillRequest;
    response: CancelAutoFillResponse;
  };
  [MessageTypes.EXECUTE_WEBSITE_FROM_POPUP]: {
    request: ExecuteWebsiteFromPopupRequest;
    response: ExecuteWebsiteFromPopupResponse;
  };
  [MessageTypes.GET_XPATH]: {
    request: GetXPathRequest;
    response: GetXPathResponse;
  };
  [MessageTypes.SHOW_XPATH_DIALOG]: {
    request: ShowXPathDialogRequest;
    response: ShowXPathDialogResponse;
  };
};
