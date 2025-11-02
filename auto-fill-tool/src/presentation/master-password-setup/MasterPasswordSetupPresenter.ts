import { PasswordStrength } from '@domain/values/PasswordStrength';
import { PasswordEntropy } from '@domain/values/PasswordEntropy';
import { MasterPasswordRequirements } from '@domain/values/MasterPasswordRequirements';
import { Result } from '@domain/values/result.value';
import type {
  MasterPasswordSetupPresenter as MasterPasswordSetupPresenterInterface,
  MasterPasswordSetupView as MasterPasswordSetupViewInterface,
  MasterPasswordSetupDependencies,
} from '../types/master-password-setup.types';

/**
 * Presenter for Master Password Setup screen
 * Orchestrates business logic and coordinates View updates
 * Delegates DOM manipulation to View, communicates with background script for secure operations
 */
export class MasterPasswordSetupPresenter implements MasterPasswordSetupPresenterInterface {
  private view: MasterPasswordSetupViewInterface;
  private logger;

  constructor(deps: MasterPasswordSetupDependencies) {
    this.view = deps.view;
    this.logger = deps.logger;
  }

  /**
   * Initialize the presenter
   * Register event listeners and set initial UI state
   */
  public init(): void {
    this.logger.info('Initializing Master Password Setup');

    // Register event listeners via View
    this.view.onPasswordInput(() => this.handlePasswordInput());
    this.view.onPasswordConfirmInput(() => this.handlePasswordConfirmInput());
    this.view.onSetupClick(() => this.handleSetup());

    // Set initial state
    this.view.disableSetupButton();
    this.view.hideMessage();
  }

  /**
   * Handle password input event
   * Calculate strength and update UI accordingly
   */
  public handlePasswordInput(): void {
    const password = this.view.getPassword();

    if (!password) {
      this.view.hideFeedback();
      this.view.disableSetupButton();
      return;
    }

    // Calculate password strength using Domain layer
    const strength = PasswordStrength.calculate(password);

    // Calculate entropy for enhanced security metrics
    const entropyAnalysis = PasswordEntropy.analyze(password);

    // Update View with strength indicator
    const percentage = strength.getPercentage();
    const color = strength.getColor();
    const levelText = chrome.i18n.getMessage(`passwordStrength_${strength.level}`);

    // Enhanced score display with entropy metrics
    const score = `${Math.round(percentage)}% (${entropyAnalysis.entropy} bits, ${entropyAnalysis.crackTime})`;

    this.view.updateStrengthIndicator(percentage, color, levelText, score);

    // Show feedback if available
    if (strength.feedback.length > 0) {
      this.view.showFeedback(strength.feedback);
    } else {
      this.view.hideFeedback();
    }

    // Validate and update button state
    this.validateAndUpdateButton();
  }

  /**
   * Handle password confirmation input event
   * Validate confirmation matches and update button state
   */
  public handlePasswordConfirmInput(): void {
    this.validateAndUpdateButton();
  }

  /**
   * Handle setup button click
   * Validate inputs and execute master password initialization via background script
   */
  // eslint-disable-next-line max-lines-per-function -- Orchestrates master password setup with validation, error handling, and UI state management. The sequential logic flow (validate password, validate confirmation, send to background, handle response, update UI) is clear and cannot be meaningfully split without harming readability.
  public async handleSetup(): Promise<void> {
    const setupResult = await this.executeSetup();

    setupResult.match({
      success: (message) => {
        this.view.showMessage(message, 'success');
        // Redirect to popup after 2 seconds
        setTimeout(() => {
          window.location.href = 'popup.html';
        }, 2000);
      },
      failure: (error) => {
        this.view.showMessage(error, 'error');
        this.view.enableSetupButton();
      },
    });

    this.view.hideLoading();
  }

  /**
   * Execute master password setup with Result pattern
   * @private
   */
  private async executeSetup(): Promise<Result<string, string>> {
    const password = this.view.getPassword();
    const passwordConfirm = this.view.getPasswordConfirm();

    // Validate password meets requirements
    const passwordValidation = MasterPasswordRequirements.validate(password);
    if (!passwordValidation.isValid) {
      return Result.failure(passwordValidation.errors.join(', '));
    }

    // Validate confirmation matches
    const confirmValidation = MasterPasswordRequirements.validateConfirmation(
      password,
      passwordConfirm
    );
    if (!confirmValidation.isValid) {
      return Result.failure(confirmValidation.errors.join(', '));
    }

    // Execute master password initialization via background script
    this.view.showLoading();
    this.view.disableSetupButton();

    const messageResult = await this.sendInitializeMessage(password, passwordConfirm);
    return messageResult;
  }

  /**
   * Send initialize message to background script
   * @private
   */
  private async sendInitializeMessage(
    password: string,
    passwordConfirm: string
  ): Promise<Result<string, string>> {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'initializeMasterPassword',
        password: password,
        confirmation: passwordConfirm,
      });

      if (response.success) {
        return Result.success(chrome.i18n.getMessage('masterPasswordSetup_successMessage'));
      } else {
        return Result.failure(
          response.error || chrome.i18n.getMessage('error_initializationFailed')
        );
      }
    } catch (error) {
      this.logger.error('Setup failed', { error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Result.failure(`${chrome.i18n.getMessage('common_error')} ${errorMessage}`);
    }
  }

  /**
   * Validate password and confirmation, update button state accordingly
   * @private
   */
  private validateAndUpdateButton(): void {
    const password = this.view.getPassword();
    const passwordConfirm = this.view.getPasswordConfirm();

    const passwordValid = MasterPasswordRequirements.validate(password).isValid;
    const confirmValid = MasterPasswordRequirements.validateConfirmation(
      password,
      passwordConfirm
    ).isValid;

    if (passwordValid && confirmValid) {
      this.view.enableSetupButton();
    } else {
      this.view.disableSetupButton();
    }
  }
}
