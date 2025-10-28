/**
 * Type definitions for Popup script dependencies and use cases
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { DeleteWebsiteUseCase } from '@usecases/websites/DeleteWebsiteUseCase';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveWebsiteWithAutomationVariablesUseCase } from '@usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';

/**
 * Repositories created by initializeRepositories function
 */
export interface PopupRepositories {
  websiteRepository: WebsiteRepository;
  xpathRepository: XPathRepository;
  automationVariablesRepository: AutomationVariablesRepository;
  systemSettingsRepository: SystemSettingsRepository;
}

/**
 * Use cases created by initializeUseCases function
 */
export interface PopupUseCases {
  getAllWebsitesUseCase: GetAllWebsitesUseCase;
  deleteWebsiteUseCase: DeleteWebsiteUseCase;
  getAllAutomationVariablesUseCase: GetAllAutomationVariablesUseCase;
  getAutomationVariablesByWebsiteIdUseCase: GetAutomationVariablesByWebsiteIdUseCase;
  saveWebsiteWithAutomationVariablesUseCase: SaveWebsiteWithAutomationVariablesUseCase;
}

/**
 * Type for SystemSettings (used in gradient background functions)
 */
export type PopupSettings = SystemSettingsCollection;

/**
 * Type for individual sync result item
 */
export interface SyncResultItem {
  configId: string;
  storageKey: string;
  success: boolean;
  error?: string;
}

/**
 * Type for execute all syncs response
 */
export interface ExecuteAllSyncsResponse {
  success: boolean;
  results: SyncResultItem[];
  error?: string;
}

/**
 * Dependencies for PopupCoordinator
 * Phase 6 pattern: Coordinator orchestrates initialization and UI setup
 */
export interface PopupCoordinatorDependencies {
  // Core components
  websiteListPresenter: {
    handleWebsiteAction: (action: string, id: string) => Promise<void>;
  };
  logger: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };

  // Settings for gradient background
  settings: PopupSettings;

  // Callback for data sync request from Alpine.js
  onDataSyncRequest: () => Promise<void>;
}

/**
 * Global window type augmentation for Alpine.js
 */
declare global {
  interface Window {
    Alpine: typeof import('@alpinejs/csp').default;
  }
}
