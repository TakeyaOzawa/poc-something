import type { UnlockView as UnlockViewInterface } from '../types/unlock.types';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

// i18n helper
const t = (key: string): string => chrome.i18n.getMessage(key);

/**
 * View implementation for Unlock Screen
 * Handles all DOM manipulation and UI updates
 * No business logic - only presentation concerns
 */
export class UnlockView implements UnlockViewInterface {
  private passwordInput: HTMLInputElement;
  private unlockBtn: HTMLButtonElement;
  private unlockForm: HTMLDivElement;
  private messageDiv: HTMLDivElement;
  private statusIndicator: HTMLDivElement;
  private attemptsRemainingDiv: HTMLDivElement;
  private loadingSpinner: HTMLDivElement;
  private sessionInfo: HTMLDivElement;
  private sessionTimer: HTMLSpanElement;
  private forgotPasswordLink: HTMLAnchorElement;

  constructor() {
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.unlockBtn = document.getElementById('unlockBtn') as HTMLButtonElement;
    this.unlockForm = document.getElementById('unlockForm') as HTMLDivElement;
    this.messageDiv = document.getElementById('message') as HTMLDivElement;
    this.statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;
    this.attemptsRemainingDiv = document.getElementById('attemptsRemaining') as HTMLDivElement;
    this.loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement;
    this.sessionInfo = document.getElementById('sessionInfo') as HTMLDivElement;
    this.sessionTimer = document.getElementById('sessionTimer') as HTMLSpanElement;
    this.forgotPasswordLink = document.getElementById('forgotPasswordLink') as HTMLAnchorElement;
  }

  // Element getters
  public getPassword(): string {
    return this.passwordInput.value;
  }

  public clearPassword(): void {
    this.passwordInput.value = '';
  }

  // Message display
  public showMessage(text: string, type: 'error' | 'success' | 'warning'): void {
    this.messageDiv.textContent = text;
    this.messageDiv.className = `message show ${type}`;
  }

  public hideMessage(): void {
    this.messageDiv.className = 'message';
  }

  // Loading state
  public showLoading(): void {
    this.loadingSpinner.classList.add('show');
  }

  public hideLoading(): void {
    this.loadingSpinner.classList.remove('show');
  }

  // Button state
  public enableUnlockButton(): void {
    this.unlockBtn.disabled = false;
  }

  public disableUnlockButton(): void {
    this.unlockBtn.disabled = true;
  }

  // UI visibility
  public showUnlockForm(): void {
    this.unlockForm.classList.add('show');
  }

  public hideUnlockForm(): void {
    this.unlockForm.classList.remove('show');
  }

  public showStatusIndicator(text: string, className: string): void {
    this.statusIndicator.className = `status-indicator show ${className}`;

    // Load template and set text content
    const fragment = TemplateLoader.load('unlock-status-template');
    const statusText = fragment.querySelector('.status-text') as HTMLElement;
    if (statusText) {
      statusText.textContent = text;
    }

    // Clear and append new content
    this.statusIndicator.textContent = '';
    this.statusIndicator.appendChild(fragment);
  }

  public hideStatusIndicator(): void {
    this.statusIndicator.classList.remove('show');
  }

  public showSessionInfo(): void {
    this.sessionInfo.style.display = 'block';
  }

  public hideSessionInfo(): void {
    this.sessionInfo.style.display = 'none';
  }

  // Timer display
  public updateSessionTimer(remainingMs: number): void {
    if (remainingMs <= 0) {
      this.sessionTimer.textContent = t('unlock_sessionExpired');
      this.sessionTimer.style.color = '#c53030';
    } else {
      this.sessionTimer.textContent = this.formatTime(remainingMs);
      if (remainingMs < 60000) {
        // Less than 1 minute - warning
        this.sessionTimer.style.color = '#dd6b20';
      } else {
        this.sessionTimer.style.color = '';
      }
    }
  }

  public updateLockoutTimer(remainingMs: number): void {
    if (remainingMs <= 0) {
      this.statusIndicator.textContent = t('unlock_lockoutExpired');
    } else {
      // Load template and set content
      const fragment = TemplateLoader.load('unlock-lockout-timer-template');
      const lockoutMessage = fragment.querySelector('.lockout-message') as HTMLElement;
      const timer = fragment.querySelector('.lockout-timer') as HTMLElement;
      const retryMessage = fragment.querySelector('.lockout-retry-message') as HTMLElement;

      if (lockoutMessage) {
        lockoutMessage.textContent = t('unlock_lockedOut');
      }
      if (timer) {
        timer.textContent = this.formatTime(remainingMs);
      }
      if (retryMessage) {
        retryMessage.textContent = t('unlock_lockedOutRetry');
      }

      // Clear and append new content
      this.statusIndicator.textContent = '';
      this.statusIndicator.appendChild(fragment);
    }
  }

  // Attempts remaining
  public showAttemptsRemaining(remaining: number): void {
    const className = remaining === 1 ? 'attempts-remaining danger' : 'attempts-remaining warning';
    this.attemptsRemainingDiv.textContent = `${t('unlock_remainingAttemptsPrefix')} ${remaining} ${t('unlock_remainingAttempts')}`;
    this.attemptsRemainingDiv.className = className;
  }

  public hideAttemptsRemaining(): void {
    this.attemptsRemainingDiv.textContent = '';
  }

  // Input state
  public markPasswordError(): void {
    this.passwordInput.classList.add('error');
  }

  public clearPasswordError(): void {
    this.passwordInput.classList.remove('error');
  }

  public focusPassword(): void {
    this.passwordInput.focus();
  }

  // Event listener registration
  public onUnlockClick(handler: () => void): void {
    this.unlockBtn.addEventListener('click', handler);
  }

  public onPasswordInput(handler: () => void): void {
    this.passwordInput.addEventListener('input', handler);
  }

  public onPasswordEnter(handler: () => void): void {
    this.passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handler();
      }
    });
  }

  public onForgotPasswordClick(handler: () => void): void {
    this.forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  public onStorageMessage(handler: (action: string) => void): void {
    chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
      if (request.action === 'sessionExpired' || request.action === 'storageLocked') {
        handler(request.action);
      }
    });
  }

  // Private helper methods
  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
