/**
 * Domain Layer: Message Types
 * Centralized action name constants for browser extension messaging
 */

/**
 * Message action types
 * All message actions used across background, content, and popup scripts
 */
export const MessageTypes = {
  // Auto-fill related
  EXECUTE_AUTO_FILL: 'executeAutoFill',
  CANCEL_AUTO_FILL: 'cancelAutoFill',
  EXECUTE_WEBSITE_FROM_POPUP: 'executeWebsiteFromPopup',

  // XPath related
  GET_XPATH: 'getXPath',
  SHOW_XPATH_DIALOG: 'showXPathDialog',

  // Internal messages (not routed through MessageRouter)
  // These messages are handled by dedicated listeners in specific contexts
  UPDATE_AUTO_FILL_PROGRESS: 'updateAutoFillProgress',
  FORWARD_LOG: 'forwardLog',

  // Recording related (handled by ContentScriptMediaRecorder and ContentScriptTabCaptureAdapter)
  START_RECORDING: 'contentScript:startRecording',
  STOP_RECORDING: 'contentScript:stopRecording',
  RECORDING_STARTED: 'contentScript:recordingStarted',
  RECORDING_STOPPED: 'contentScript:recordingStopped',
  RECORDING_ERROR: 'contentScript:recordingError',

  // Background service message handlers (handled in background/index.ts)
  // These messages are processed by dedicated listener in background script
  INITIALIZE_MASTER_PASSWORD: 'initializeMasterPassword',
  UNLOCK_STORAGE: 'unlockStorage',
  LOCK_STORAGE: 'lockStorage',
  CHECK_UNLOCK_STATUS: 'checkUnlockStatus',
  CHECK_STORAGE_STATUS: 'checkStorageStatus',
  EXECUTE_MANUAL_SYNC: 'executeManualSync',
  EXECUTE_ALL_SYNCS: 'executeAllSyncs',
  RESUME_AUTO_FILL: 'resumeAutoFill',
  GET_CURRENT_TAB_ID: 'getCurrentTabId',
} as const;

/**
 * Type alias for message action types
 */
export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

/**
 * Type guard to check if a string is a valid message type
 */
export function isValidMessageType(action: string): action is MessageType {
  return Object.values(MessageTypes).includes(action as MessageType);
}
