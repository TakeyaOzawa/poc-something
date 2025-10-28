import { Logger } from '@domain/types/logger.types';

/**
 * View interface for Master Password Setup screen
 * Handles all DOM manipulation and UI updates
 */
export interface MasterPasswordSetupView {
  // DOM element getters
  getPassword(): string;
  getPasswordConfirm(): string;

  // Display updates
  showMessage(text: string, type: 'error' | 'success'): void;
  hideMessage(): void;
  showLoading(): void;
  hideLoading(): void;
  updateStrengthIndicator(
    percentage: number,
    color: string,
    levelText: string,
    score: string
  ): void;
  showFeedback(feedback: string[]): void;
  hideFeedback(): void;
  enableSetupButton(): void;
  disableSetupButton(): void;

  // Event listener registration
  onPasswordInput(handler: () => void): void;
  onPasswordConfirmInput(handler: () => void): void;
  onSetupClick(handler: () => void): void;
}

/**
 * Presenter interface for Master Password Setup screen
 * Orchestrates business logic and coordinates View updates
 */
export interface MasterPasswordSetupPresenter {
  // Initialization
  init(): void;

  // Event handlers
  handlePasswordInput(): void;
  handlePasswordConfirmInput(): void;
  handleSetup(): Promise<void>;
}

/**
 * Dependencies for MasterPasswordSetupPresenter
 * Injected via constructor for testability
 */
export interface MasterPasswordSetupDependencies {
  view: MasterPasswordSetupView;
  logger: Logger;
}
