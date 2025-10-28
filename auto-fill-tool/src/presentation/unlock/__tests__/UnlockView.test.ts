/**
 * Unit tests for UnlockView
 * Tests all DOM manipulation methods in isolation
 */

import { UnlockView } from '../UnlockView';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

// Mock chrome API
const mockAddListener = jest.fn();
global.chrome = {
  i18n: {
    getMessage: jest.fn((key: string) => `mock_${key}`),
  },
  runtime: {
    onMessage: {
      addListener: mockAddListener,
    },
  },
} as any;

describe('UnlockView', () => {
  let view: UnlockView;
  let mockPasswordInput: HTMLInputElement;
  let mockUnlockBtn: HTMLButtonElement;
  let mockUnlockForm: HTMLDivElement;
  let mockMessageDiv: HTMLDivElement;
  let mockStatusIndicator: HTMLDivElement;
  let mockAttemptsRemainingDiv: HTMLDivElement;
  let mockLoadingSpinner: HTMLDivElement;
  let mockSessionInfo: HTMLDivElement;
  let mockSessionTimer: HTMLSpanElement;
  let mockForgotPasswordLink: HTMLAnchorElement;

  beforeEach(() => {
    // Reset chrome runtime mock
    mockAddListener.mockClear();

    // Create mock DOM elements
    mockPasswordInput = document.createElement('input') as HTMLInputElement;
    mockUnlockBtn = document.createElement('button') as HTMLButtonElement;
    mockUnlockForm = document.createElement('div') as HTMLDivElement;
    mockMessageDiv = document.createElement('div') as HTMLDivElement;
    mockStatusIndicator = document.createElement('div') as HTMLDivElement;
    mockAttemptsRemainingDiv = document.createElement('div') as HTMLDivElement;
    mockLoadingSpinner = document.createElement('div') as HTMLDivElement;
    mockSessionInfo = document.createElement('div') as HTMLDivElement;
    mockSessionTimer = document.createElement('span') as HTMLSpanElement;
    mockForgotPasswordLink = document.createElement('a') as HTMLAnchorElement;

    // Add IDs for getElementById
    mockPasswordInput.id = 'password';
    mockUnlockBtn.id = 'unlockBtn';
    mockUnlockForm.id = 'unlockForm';
    mockMessageDiv.id = 'message';
    mockStatusIndicator.id = 'statusIndicator';
    mockAttemptsRemainingDiv.id = 'attemptsRemaining';
    mockLoadingSpinner.id = 'loadingSpinner';
    mockSessionInfo.id = 'sessionInfo';
    mockSessionTimer.id = 'sessionTimer';
    mockForgotPasswordLink.id = 'forgotPasswordLink';

    // Set up unlock-status-template
    const statusTemplate = document.createElement('template');
    statusTemplate.id = 'unlock-status-template';
    statusTemplate.innerHTML = `
      <span class="status-text" data-bind="text"></span>
    `;
    document.body.appendChild(statusTemplate);

    // Set up unlock-lockout-timer-template
    const lockoutTemplate = document.createElement('template');
    lockoutTemplate.id = 'unlock-lockout-timer-template';
    lockoutTemplate.innerHTML = `
      <div class="lockout-content">
        <div class="lockout-message" data-bind="lockedOutMessage"></div>
        <div class="lockout-timer" data-bind="timer"></div>
        <div class="lockout-retry-message" data-bind="retryMessage"></div>
      </div>
    `;
    document.body.appendChild(lockoutTemplate);

    // Mock document.getElementById
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      const elements: { [key: string]: HTMLElement } = {
        password: mockPasswordInput,
        unlockBtn: mockUnlockBtn,
        unlockForm: mockUnlockForm,
        message: mockMessageDiv,
        statusIndicator: mockStatusIndicator,
        attemptsRemaining: mockAttemptsRemainingDiv,
        loadingSpinner: mockLoadingSpinner,
        sessionInfo: mockSessionInfo,
        sessionTimer: mockSessionTimer,
        forgotPasswordLink: mockForgotPasswordLink,
        'unlock-status-template': statusTemplate,
        'unlock-lockout-timer-template': lockoutTemplate,
      };
      return elements[id] || null;
    });

    view = new UnlockView();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    TemplateLoader.clearCache();
  });

  describe('Constructor', () => {
    it('should initialize all DOM element references', () => {
      expect(document.getElementById).toHaveBeenCalledWith('password');
      expect(document.getElementById).toHaveBeenCalledWith('unlockBtn');
      expect(document.getElementById).toHaveBeenCalledWith('unlockForm');
      expect(document.getElementById).toHaveBeenCalledWith('message');
      expect(document.getElementById).toHaveBeenCalledWith('statusIndicator');
      expect(document.getElementById).toHaveBeenCalledWith('attemptsRemaining');
      expect(document.getElementById).toHaveBeenCalledWith('loadingSpinner');
      expect(document.getElementById).toHaveBeenCalledWith('sessionInfo');
      expect(document.getElementById).toHaveBeenCalledWith('sessionTimer');
      expect(document.getElementById).toHaveBeenCalledWith('forgotPasswordLink');
    });
  });

  describe('Element getters', () => {
    it('should get password value', () => {
      mockPasswordInput.value = 'test-password';
      expect(view.getPassword()).toBe('test-password');
    });

    it('should clear password value', () => {
      mockPasswordInput.value = 'test-password';
      view.clearPassword();
      expect(mockPasswordInput.value).toBe('');
    });
  });

  describe('Message display', () => {
    it('should show error message', () => {
      view.showMessage('Error message', 'error');
      expect(mockMessageDiv.textContent).toBe('Error message');
      expect(mockMessageDiv.className).toBe('message show error');
    });

    it('should show success message', () => {
      view.showMessage('Success message', 'success');
      expect(mockMessageDiv.textContent).toBe('Success message');
      expect(mockMessageDiv.className).toBe('message show success');
    });

    it('should show warning message', () => {
      view.showMessage('Warning message', 'warning');
      expect(mockMessageDiv.textContent).toBe('Warning message');
      expect(mockMessageDiv.className).toBe('message show warning');
    });

    it('should hide message', () => {
      mockMessageDiv.className = 'message show error';
      view.hideMessage();
      expect(mockMessageDiv.className).toBe('message');
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner', () => {
      view.showLoading();
      expect(mockLoadingSpinner.classList.contains('show')).toBe(true);
    });

    it('should hide loading spinner', () => {
      mockLoadingSpinner.classList.add('show');
      view.hideLoading();
      expect(mockLoadingSpinner.classList.contains('show')).toBe(false);
    });
  });

  describe('Button state', () => {
    it('should enable unlock button', () => {
      mockUnlockBtn.disabled = true;
      view.enableUnlockButton();
      expect(mockUnlockBtn.disabled).toBe(false);
    });

    it('should disable unlock button', () => {
      mockUnlockBtn.disabled = false;
      view.disableUnlockButton();
      expect(mockUnlockBtn.disabled).toBe(true);
    });
  });

  describe('UI visibility', () => {
    it('should show unlock form', () => {
      view.showUnlockForm();
      expect(mockUnlockForm.classList.contains('show')).toBe(true);
    });

    it('should hide unlock form', () => {
      mockUnlockForm.classList.add('show');
      view.hideUnlockForm();
      expect(mockUnlockForm.classList.contains('show')).toBe(false);
    });

    it('should show status indicator with text and className', () => {
      view.showStatusIndicator('Test status', 'unlocked');
      expect(mockStatusIndicator.className).toBe('status-indicator show unlocked');
      const statusText = mockStatusIndicator.querySelector('.status-text');
      expect(statusText).toBeTruthy();
      expect(statusText?.textContent).toBe('Test status');
    });

    it('should hide status indicator', () => {
      mockStatusIndicator.classList.add('show');
      view.hideStatusIndicator();
      expect(mockStatusIndicator.classList.contains('show')).toBe(false);
    });

    it('should show session info', () => {
      view.showSessionInfo();
      expect(mockSessionInfo.style.display).toBe('block');
    });

    it('should hide session info', () => {
      mockSessionInfo.style.display = 'block';
      view.hideSessionInfo();
      expect(mockSessionInfo.style.display).toBe('none');
    });
  });

  describe('Timer display', () => {
    describe('updateSessionTimer', () => {
      it('should display formatted time for positive remaining time', () => {
        const remainingMs = 125000; // 2:05
        view.updateSessionTimer(remainingMs);
        expect(mockSessionTimer.textContent).toBe('02:05');
        expect(mockSessionTimer.style.color).toBe('');
      });

      it('should display warning color for less than 1 minute', () => {
        const remainingMs = 45000; // 0:45
        view.updateSessionTimer(remainingMs);
        expect(mockSessionTimer.textContent).toBe('00:45');
        // JSDOM converts hex to RGB format
        expect(mockSessionTimer.style.color).toBe('rgb(221, 107, 32)');
      });

      it('should display expired message for zero or negative time', () => {
        view.updateSessionTimer(0);
        expect(mockSessionTimer.textContent).toBe('mock_unlock_sessionExpired');
        // JSDOM converts hex to RGB format
        expect(mockSessionTimer.style.color).toBe('rgb(197, 48, 48)');
      });

      it('should display expired message for negative time', () => {
        view.updateSessionTimer(-1000);
        expect(mockSessionTimer.textContent).toBe('mock_unlock_sessionExpired');
        // JSDOM converts hex to RGB format
        expect(mockSessionTimer.style.color).toBe('rgb(197, 48, 48)');
      });
    });

    describe('updateLockoutTimer', () => {
      it('should display formatted lockout message with time', () => {
        const remainingMs = 300000; // 5:00
        view.updateLockoutTimer(remainingMs);
        const lockoutMessage = mockStatusIndicator.querySelector('.lockout-message');
        const timer = mockStatusIndicator.querySelector('.lockout-timer');
        const retryMessage = mockStatusIndicator.querySelector('.lockout-retry-message');
        expect(lockoutMessage?.textContent).toBe('mock_unlock_lockedOut');
        expect(timer?.textContent).toBe('05:00');
        expect(retryMessage?.textContent).toBe('mock_unlock_lockedOutRetry');
      });

      it('should display expired message for zero or negative time', () => {
        view.updateLockoutTimer(0);
        expect(mockStatusIndicator.textContent).toBe('mock_unlock_lockoutExpired');
      });

      it('should display expired message for negative time', () => {
        view.updateLockoutTimer(-1000);
        expect(mockStatusIndicator.textContent).toBe('mock_unlock_lockoutExpired');
      });
    });
  });

  describe('Attempts remaining', () => {
    it('should show warning for 2+ attempts remaining', () => {
      view.showAttemptsRemaining(3);
      expect(mockAttemptsRemainingDiv.textContent).toContain('mock_unlock_remainingAttemptsPrefix');
      expect(mockAttemptsRemainingDiv.textContent).toContain('3');
      expect(mockAttemptsRemainingDiv.textContent).toContain('mock_unlock_remainingAttempts');
      expect(mockAttemptsRemainingDiv.className).toBe('attempts-remaining warning');
    });

    it('should show danger for 1 attempt remaining', () => {
      view.showAttemptsRemaining(1);
      expect(mockAttemptsRemainingDiv.textContent).toContain('mock_unlock_remainingAttemptsPrefix');
      expect(mockAttemptsRemainingDiv.textContent).toContain('1');
      expect(mockAttemptsRemainingDiv.textContent).toContain('mock_unlock_remainingAttempts');
      expect(mockAttemptsRemainingDiv.className).toBe('attempts-remaining danger');
    });

    it('should hide attempts remaining', () => {
      mockAttemptsRemainingDiv.textContent = 'Some text';
      view.hideAttemptsRemaining();
      expect(mockAttemptsRemainingDiv.textContent).toBe('');
    });
  });

  describe('Input state', () => {
    it('should mark password error', () => {
      view.markPasswordError();
      expect(mockPasswordInput.classList.contains('error')).toBe(true);
    });

    it('should clear password error', () => {
      mockPasswordInput.classList.add('error');
      view.clearPasswordError();
      expect(mockPasswordInput.classList.contains('error')).toBe(false);
    });

    it('should focus password input', () => {
      const focusSpy = jest.spyOn(mockPasswordInput, 'focus');
      view.focusPassword();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Event listener registration', () => {
    it('should register unlock click handler', () => {
      const handler = jest.fn();
      const addEventListenerSpy = jest.spyOn(mockUnlockBtn, 'addEventListener');
      view.onUnlockClick(handler);
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler);
    });

    it('should register password input handler', () => {
      const handler = jest.fn();
      const addEventListenerSpy = jest.spyOn(mockPasswordInput, 'addEventListener');
      view.onPasswordInput(handler);
      expect(addEventListenerSpy).toHaveBeenCalledWith('input', handler);
    });

    it('should register password Enter key handler', () => {
      const handler = jest.fn();
      const addEventListenerSpy = jest.spyOn(mockPasswordInput, 'addEventListener');
      view.onPasswordEnter(handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keypress', expect.any(Function));

      // Simulate Enter key press
      const keypressCallback = addEventListenerSpy.mock.calls[0][1] as (e: KeyboardEvent) => void;
      keypressCallback({ key: 'Enter' } as KeyboardEvent);
      expect(handler).toHaveBeenCalled();
    });

    it('should not call handler for non-Enter key', () => {
      const handler = jest.fn();
      const addEventListenerSpy = jest.spyOn(mockPasswordInput, 'addEventListener');
      view.onPasswordEnter(handler);

      const keypressCallback = addEventListenerSpy.mock.calls[0][1] as (e: KeyboardEvent) => void;
      keypressCallback({ key: 'a' } as KeyboardEvent);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should register forgot password click handler', () => {
      const handler = jest.fn();
      const addEventListenerSpy = jest.spyOn(mockForgotPasswordLink, 'addEventListener');
      view.onForgotPasswordClick(handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

      // Simulate click
      const mockEvent = { preventDefault: jest.fn() };
      const clickCallback = addEventListenerSpy.mock.calls[0][1] as (e: Event) => void;
      clickCallback(mockEvent as any);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should register storage message handler for sessionExpired', () => {
      const handler = jest.fn();
      view.onStorageMessage(handler);

      expect(mockAddListener).toHaveBeenCalled();

      // Simulate sessionExpired message
      const messageCallback = mockAddListener.mock.calls[0][0];
      messageCallback({ action: 'sessionExpired' }, {} as any, jest.fn());
      expect(handler).toHaveBeenCalledWith('sessionExpired');
    });

    it('should register storage message handler for storageLocked', () => {
      const handler = jest.fn();
      view.onStorageMessage(handler);

      // Simulate storageLocked message
      const messageCallback = mockAddListener.mock.calls[0][0];
      messageCallback({ action: 'storageLocked' }, {} as any, jest.fn());
      expect(handler).toHaveBeenCalledWith('storageLocked');
    });

    it('should not call handler for unrelated messages', () => {
      const handler = jest.fn();
      view.onStorageMessage(handler);

      // Simulate unrelated message
      const messageCallback = mockAddListener.mock.calls[0][0];
      messageCallback({ action: 'otherAction' }, {} as any, jest.fn());
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
