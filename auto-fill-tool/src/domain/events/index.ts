/**
 * Domain Layer: Events Module
 * Central export point for domain events infrastructure
 */

// Core event infrastructure
export * from './DomainEvent';
export * from './EventHandler';
export * from './EventBus';

// Concrete domain events
export * from './events/AutoFillEvents';
export * from './events/WebsiteEvents';
export * from './events/XPathEvents';
export * from './events/SyncEvents';
