import type { MasterPasswordSetupView as MasterPasswordSetupViewInterface } from '../types/master-password-setup.types';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

/**
 * View implementation for Master Password Setup screen
 * Responsible for all DOM manipulation and UI updates
 * No business logic - only presentation concerns
 */
export class MasterPasswordSetupView implements MasterPasswordSetupViewInterface {
  private passwordInput: HTMLInputElement;
  private passwordConfirmInput: HTMLInputElement;
  private setupBtn: HTMLButtonElement;
  private messageDiv: HTMLDivElement;
  private strengthIndicator: HTMLDivElement;
  private strengthBar: HTMLDivElement;
  private strengthText: HTMLSpanElement;
  private strengthScore: HTMLSpanElement;
  private feedbackDiv: HTMLDivElement;
  private loadingSpinner: HTMLDivElement;

  constructor() {
    // Initialize all DOM element references
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.passwordConfirmInput = document.getElementById('passwordConfirm') as HTMLInputElement;
    this.setupBtn = document.getElementById('setupBtn') as HTMLButtonElement;
    this.messageDiv = document.getElementById('message') as HTMLDivElement;
    this.strengthIndicator = document.getElementById('strengthIndicator') as HTMLDivElement;
    this.strengthBar = document.getElementById('strengthBar') as HTMLDivElement;
    this.strengthText = document.getElementById('strengthText') as HTMLSpanElement;
    this.strengthScore = document.getElementById('strengthScore') as HTMLSpanElement;
    this.feedbackDiv = document.getElementById('feedback') as HTMLDivElement;
    this.loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement;
  }

  // DOM element getters
  public getPassword(): string {
    return this.passwordInput.value;
  }

  public getPasswordConfirm(): string {
    return this.passwordConfirmInput.value;
  }

  // Message display
  public showMessage(text: string, type: 'error' | 'success'): void {
    this.messageDiv.textContent = text;
    this.messageDiv.className = `message show ${type}`;
  }

  public hideMessage(): void {
    this.messageDiv.className = 'message';
  }

  // Loading spinner
  public showLoading(): void {
    this.loadingSpinner.style.display = 'flex';
  }

  public hideLoading(): void {
    this.loadingSpinner.style.display = 'none';
  }

  // Password strength indicator
  public updateStrengthIndicator(
    percentage: number,
    color: string,
    levelText: string,
    score: string
  ): void {
    this.strengthIndicator.style.display = 'block';
    this.strengthBar.style.width = `${percentage}%`;
    this.strengthBar.style.backgroundColor = color;
    this.strengthText.textContent = `${chrome.i18n.getMessage('masterPasswordSetup_strengthLabel')} ${levelText}`;
    this.strengthScore.textContent = score;
  }

  // Password feedback
  public showFeedback(feedback: string[]): void {
    const fragment = TemplateLoader.load('password-feedback-list-template');

    const feedbackContainer = fragment.querySelector('.feedback') as HTMLDivElement;
    const strongElement = feedbackContainer.querySelector('strong') as HTMLElement;
    const ulElement = feedbackContainer.querySelector('ul') as HTMLUListElement;

    // Set title
    strongElement.textContent = `${chrome.i18n.getMessage('passwordFeedback_title')}:`;

    // Add list items (textContent automatically escapes HTML)
    feedback.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item; // Automatic XSS protection
      ulElement.appendChild(li);
    });

    // Clear and append
    this.feedbackDiv.innerHTML = '';
    this.feedbackDiv.appendChild(feedbackContainer);
    this.feedbackDiv.classList.add('show');
  }

  public hideFeedback(): void {
    this.feedbackDiv.classList.remove('show');
  }

  // Button state management
  public enableSetupButton(): void {
    this.setupBtn.disabled = false;
  }

  public disableSetupButton(): void {
    this.setupBtn.disabled = true;
  }

  // Event listener registration
  public onPasswordInput(handler: () => void): void {
    this.passwordInput.addEventListener('input', handler);
  }

  public onPasswordConfirmInput(handler: () => void): void {
    this.passwordConfirmInput.addEventListener('input', handler);
  }

  public onSetupClick(handler: () => void): void {
    this.setupBtn.addEventListener('click', handler);
  }
}
