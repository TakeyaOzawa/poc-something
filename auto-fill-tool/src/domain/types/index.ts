/**
 * Domain Layer Type Definitions
 * Central export point for all domain types (interfaces and type aliases only)
 *
 * Note: Result and ValidationResult are Value Objects and have been moved to domain/values/
 */

// Progress types
export * from './progress.types';

// Action executor types
export * from './action.types';

// Port interface types
export * from './sync-port.types';
export * from './auto-fill-port.types';
export * from './scheduler-port.types';

// Infrastructure interface types
export * from './http-client.types';
export * from './lockout-manager.types';

// Data processing interface types
export * from './csv-converter.types';
export * from './conflict-resolver.types';
export * from './data-mapper.types';

// XPath generation port types
export * from './xpath-generation-port.types';

// Logging and notification port types
export * from './logger.types';
export * from './log-aggregator-port.types';
export * from './notification-port.types';
export * from './sync-state-notifier.types';

// Infrastructure port types (Ports & Adapters pattern)
export * from './crypto-port.types';
export * from './secure-storage-port.types';
export * from './tab-capture-port.types';
export * from './notion-sync-port.types';
export * from './spreadsheet-sync-port.types';

// Messaging protocol types
export * from './messaging';
