import { MasterPasswordSetupView } from '../MasterPasswordSetupView';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

describe('MasterPasswordSetupView', () => {
  let view: MasterPasswordSetupView;

  // Mock DOM elements
  const mockPasswordInput = document.createElement('input');
  const mockPasswordConfirmInput = document.createElement('input');
  const mockSetupBtn = document.createElement('button');
  const mockMessageDiv = document.createElement('div');
  const mockStrengthIndicator = document.createElement('div');
  const mockStrengthBar = document.createElement('div');
  const mockStrengthText = document.createElement('span');
  const mockStrengthScore = document.createElement('span');
  const mockFeedbackDiv = document.createElement('div');
  const mockLoadingSpinner = document.createElement('div');

  // Mock chrome.i18n.getMessage
  global.chrome = {
    i18n: {
      getMessage: jest.fn((key: string) => key),
    },
  } as any;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '';

    mockPasswordInput.id = 'password';
    mockPasswordConfirmInput.id = 'passwordConfirm';
    mockSetupBtn.id = 'setupBtn';
    mockMessageDiv.id = 'message';
    mockStrengthIndicator.id = 'strengthIndicator';
    mockStrengthBar.id = 'strengthBar';
    mockStrengthText.id = 'strengthText';
    mockStrengthScore.id = 'strengthScore';
    mockFeedbackDiv.id = 'feedback';
    mockLoadingSpinner.id = 'loadingSpinner';

    document.body.appendChild(mockPasswordInput);
    document.body.appendChild(mockPasswordConfirmInput);
    document.body.appendChild(mockSetupBtn);
    document.body.appendChild(mockMessageDiv);
    document.body.appendChild(mockStrengthIndicator);
    document.body.appendChild(mockStrengthBar);
    document.body.appendChild(mockStrengthText);
    document.body.appendChild(mockStrengthScore);
    document.body.appendChild(mockFeedbackDiv);
    document.body.appendChild(mockLoadingSpinner);

    // Add template setup
    const feedbackTemplate = document.createElement('template');
    feedbackTemplate.id = 'password-feedback-list-template';
    feedbackTemplate.innerHTML = `
      <div class="feedback">
        <strong data-bind="title"></strong>
        <ul data-bind-list="items"></ul>
      </div>
    `;
    document.body.appendChild(feedbackTemplate);

    view = new MasterPasswordSetupView();
  });

  afterEach(() => {
    TemplateLoader.clearCache();
    document.body.innerHTML = '';
  });

  describe('DOM element getters', () => {
    it('should get password value', () => {
      mockPasswordInput.value = 'test-password';
      expect(view.getPassword()).toBe('test-password');
    });

    it('should get password confirm value', () => {
      mockPasswordConfirmInput.value = 'test-confirm';
      expect(view.getPasswordConfirm()).toBe('test-confirm');
    });
  });

  describe('Message display', () => {
    it('should show error message', () => {
      view.showMessage('Test error', 'error');

      expect(mockMessageDiv.textContent).toBe('Test error');
      expect(mockMessageDiv.className).toBe('message show error');
    });

    it('should show success message', () => {
      view.showMessage('Test success', 'success');

      expect(mockMessageDiv.textContent).toBe('Test success');
      expect(mockMessageDiv.className).toBe('message show success');
    });

    it('should hide message', () => {
      mockMessageDiv.className = 'message show error';

      view.hideMessage();

      expect(mockMessageDiv.className).toBe('message');
    });
  });

  describe('Loading spinner', () => {
    it('should show loading spinner', () => {
      view.showLoading();

      expect(mockLoadingSpinner.style.display).toBe('flex');
    });

    it('should hide loading spinner', () => {
      mockLoadingSpinner.style.display = 'flex';

      view.hideLoading();

      expect(mockLoadingSpinner.style.display).toBe('none');
    });
  });

  describe('Password strength indicator', () => {
    it('should update strength indicator with all parameters', () => {
      view.updateStrengthIndicator(75, '#00ff00', 'Strong', '75%');

      expect(mockStrengthIndicator.style.display).toBe('block');
      expect(mockStrengthBar.style.width).toBe('75%');
      // Browser converts hex to RGB format
      expect(mockStrengthBar.style.backgroundColor).toMatch(/#00ff00|rgb\(0,\s*255,\s*0\)/);
      expect(mockStrengthText.textContent).toContain('masterPasswordSetup_strengthLabel');
      expect(mockStrengthText.textContent).toContain('Strong');
      expect(mockStrengthScore.textContent).toBe('75%');
    });

    it('should handle 0% strength', () => {
      view.updateStrengthIndicator(0, '#ff0000', 'Weak', '0%');

      expect(mockStrengthBar.style.width).toBe('0%');
      expect(mockStrengthScore.textContent).toBe('0%');
    });

    it('should handle 100% strength', () => {
      view.updateStrengthIndicator(100, '#00ff00', 'Very Strong', '100%');

      expect(mockStrengthBar.style.width).toBe('100%');
      expect(mockStrengthScore.textContent).toBe('100%');
    });
  });

  describe('Password feedback', () => {
    it('should show feedback with suggestions', () => {
      const feedback = ['Add more characters', 'Include numbers', 'Include symbols'];

      view.showFeedback(feedback);

      const strong = mockFeedbackDiv.querySelector('strong');
      const listItems = mockFeedbackDiv.querySelectorAll('li');

      expect(strong?.textContent).toContain('passwordFeedback_title');
      expect(listItems.length).toBe(3);
      expect(listItems[0].textContent).toBe('Add more characters');
      expect(listItems[1].textContent).toBe('Include numbers');
      expect(listItems[2].textContent).toBe('Include symbols');
      expect(mockFeedbackDiv.classList.contains('show')).toBe(true);
    });

    it('should show feedback with single suggestion', () => {
      const feedback = ['Add uppercase letters'];

      view.showFeedback(feedback);

      const listItems = mockFeedbackDiv.querySelectorAll('li');
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toBe('Add uppercase letters');
    });

    it('should hide feedback', () => {
      mockFeedbackDiv.classList.add('show');

      view.hideFeedback();

      expect(mockFeedbackDiv.classList.contains('show')).toBe(false);
    });
  });

  describe('Button state management', () => {
    it('should enable setup button', () => {
      mockSetupBtn.disabled = true;

      view.enableSetupButton();

      expect(mockSetupBtn.disabled).toBe(false);
    });

    it('should disable setup button', () => {
      mockSetupBtn.disabled = false;

      view.disableSetupButton();

      expect(mockSetupBtn.disabled).toBe(true);
    });
  });

  describe('Event listener registration', () => {
    it('should register password input handler', () => {
      const handler = jest.fn();

      view.onPasswordInput(handler);

      mockPasswordInput.dispatchEvent(new Event('input'));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should register password confirm input handler', () => {
      const handler = jest.fn();

      view.onPasswordConfirmInput(handler);

      mockPasswordConfirmInput.dispatchEvent(new Event('input'));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should register setup button click handler', () => {
      const handler = jest.fn();

      view.onSetupClick(handler);

      mockSetupBtn.dispatchEvent(new Event('click'));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple password input events', () => {
      const handler = jest.fn();

      view.onPasswordInput(handler);

      mockPasswordInput.dispatchEvent(new Event('input'));
      mockPasswordInput.dispatchEvent(new Event('input'));
      mockPasswordInput.dispatchEvent(new Event('input'));

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });
});
