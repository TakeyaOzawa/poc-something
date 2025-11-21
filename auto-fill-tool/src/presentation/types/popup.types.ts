/**
 * Type definitions for Popup script dependencies and use cases
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { GetAllWebsitesUseCase } from '@application/usecases/websites/GetAllWebsitesUseCase';
import { DeleteWebsiteUseCase } from '@application/usecases/websites/DeleteWebsiteUseCase';
import { GetAllAutomationVariablesUseCase } from '@application/usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@application/usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveWebsiteWithAutomationVariablesUseCase } from '@application/usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';
import { SystemSettingsViewModel } from './SystemSettingsViewModel';

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
export type PopupSettings = SystemSettingsViewModel;

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
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
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
