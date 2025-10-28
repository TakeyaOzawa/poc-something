import { PasswordStrength } from '@domain/values/PasswordStrength';
import { PasswordEntropy } from '@domain/values/PasswordEntropy';
import { MasterPasswordRequirements } from '@domain/values/MasterPasswordRequirements';
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
    const password = this.view.getPassword();
    const passwordConfirm = this.view.getPasswordConfirm();

    // Validate password meets requirements
    const passwordValidation = MasterPasswordRequirements.validate(password);
    if (!passwordValidation.isValid) {
      this.view.showMessage(passwordValidation.errors.join(', '), 'error');
      return;
    }

    // Validate confirmation matches
    const confirmValidation = MasterPasswordRequirements.validateConfirmation(
      password,
      passwordConfirm
    );
    if (!confirmValidation.isValid) {
      this.view.showMessage(confirmValidation.errors.join(', '), 'error');
      return;
    }

    // Execute master password initialization via background script
    this.view.showLoading();
    this.view.disableSetupButton();

    try {
      // Send message to background service worker
      const response = await chrome.runtime.sendMessage({
        action: 'initializeMasterPassword',
        password: password,
        confirmation: passwordConfirm,
      });

      if (response.success) {
        this.view.showMessage(
          chrome.i18n.getMessage('masterPasswordSetup_successMessage'),
          'success'
        );
        // Redirect to popup after 2 seconds
        setTimeout(() => {
          window.location.href = 'popup.html';
        }, 2000);
      } else {
        this.view.showMessage(
          response.error || chrome.i18n.getMessage('error_initializationFailed'),
          'error'
        );
        this.view.enableSetupButton();
      }
    } catch (error) {
      this.logger.error('Setup failed', { error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.view.showMessage(`${chrome.i18n.getMessage('common_error')} ${errorMessage}`, 'error');
      this.view.enableSetupButton();
    } finally {
      this.view.hideLoading();
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
