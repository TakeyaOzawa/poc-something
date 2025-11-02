import { MasterPasswordSetupPresenter } from '../MasterPasswordSetupPresenter';
import type { MasterPasswordSetupView } from '../../types';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('MasterPasswordSetupPresenter', () => {
  let presenter: MasterPasswordSetupPresenter;
  let mockView: jest.Mocked<MasterPasswordSetupView>;
  let mockLogger: jest.Mocked<Logger>;

  // Mock chrome.i18n.getMessage
  global.chrome = {
    i18n: {
      getMessage: jest.fn((key: string) => key),
    },
    runtime: {
      sendMessage: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    // Create mock View
    mockView = {
      getPassword: jest.fn(),
      getPasswordConfirm: jest.fn(),
      showMessage: jest.fn(),
      hideMessage: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      updateStrengthIndicator: jest.fn(),
      showFeedback: jest.fn(),
      hideFeedback: jest.fn(),
      enableSetupButton: jest.fn(),
      disableSetupButton: jest.fn(),
      onPasswordInput: jest.fn(),
      onPasswordConfirmInput: jest.fn(),
      onSetupClick: jest.fn(),
    };

    // Create mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setLevel: jest.fn(),
      createChild: jest.fn(() => mockLogger),
    } as any;

    // Create presenter instance
    presenter = new MasterPasswordSetupPresenter({
      view: mockView,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should register event listeners via View', () => {
      presenter.init();

      expect(mockView.onPasswordInput).toHaveBeenCalledWith(expect.any(Function));
      expect(mockView.onPasswordConfirmInput).toHaveBeenCalledWith(expect.any(Function));
      expect(mockView.onSetupClick).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set initial UI state to disabled button and hidden message', () => {
      presenter.init();

      expect(mockView.disableSetupButton).toHaveBeenCalled();
      expect(mockView.hideMessage).toHaveBeenCalled();
    });

    it('should log initialization', () => {
      presenter.init();

      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Master Password Setup');
    });
  });

  describe('handlePasswordInput', () => {
    it('should hide feedback and disable button when password is empty', () => {
      mockView.getPassword.mockReturnValue('');

      presenter.handlePasswordInput();

      expect(mockView.hideFeedback).toHaveBeenCalled();
      expect(mockView.disableSetupButton).toHaveBeenCalled();
      expect(mockView.updateStrengthIndicator).not.toHaveBeenCalled();
    });

    it('should calculate strength and update indicator for valid password', () => {
      mockView.getPassword.mockReturnValue('ValidPassword123!');
      mockView.getPasswordConfirm.mockReturnValue('');

      presenter.handlePasswordInput();

      expect(mockView.updateStrengthIndicator).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should show feedback when password has improvement suggestions', () => {
      mockView.getPassword.mockReturnValue('weak');
      mockView.getPasswordConfirm.mockReturnValue('');

      presenter.handlePasswordInput();

      // Weak passwords should have feedback
      expect(mockView.showFeedback).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should hide feedback when password is strong', () => {
      mockView.getPassword.mockReturnValue('VeryStrongP@ssw0rd123!');
      mockView.getPasswordConfirm.mockReturnValue('');

      presenter.handlePasswordInput();

      // Strong passwords may have no feedback
      expect(mockView.hideFeedback).toHaveBeenCalled();
    });

    it('should enable button when password and confirmation are valid', () => {
      const password = 'ValidPassword123!';
      mockView.getPassword.mockReturnValue(password);
      mockView.getPasswordConfirm.mockReturnValue(password);

      presenter.handlePasswordInput();

      expect(mockView.enableSetupButton).toHaveBeenCalled();
    });
  });

  describe('handlePasswordConfirmInput', () => {
    it('should validate and update button state', () => {
      const password = 'ValidPassword123!';
      mockView.getPassword.mockReturnValue(password);
      mockView.getPasswordConfirm.mockReturnValue(password);

      presenter.handlePasswordConfirmInput();

      expect(mockView.enableSetupButton).toHaveBeenCalled();
    });

    it('should disable button when confirmation does not match', () => {
      mockView.getPassword.mockReturnValue('ValidPassword123!');
      mockView.getPasswordConfirm.mockReturnValue('DifferentPassword');

      presenter.handlePasswordConfirmInput();

      expect(mockView.disableSetupButton).toHaveBeenCalled();
    });
  });

  describe('handleSetup', () => {
    const validPassword = 'ValidPassword123!';
    const sendMessageMock = jest.fn();

    beforeEach(() => {
      global.chrome.runtime.sendMessage = sendMessageMock;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show error if password validation fails', async () => {
      mockView.getPassword.mockReturnValue('weak');
      mockView.getPasswordConfirm.mockReturnValue('weak');

      await presenter.handleSetup();

      expect(mockView.showMessage).toHaveBeenCalledWith(expect.any(String), 'error');
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('should show error if confirmation validation fails', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue('DifferentPassword');

      await presenter.handleSetup();

      expect(mockView.showMessage).toHaveBeenCalledWith(expect.any(String), 'error');
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('should show loading and disable button before sending message', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockResolvedValue({ success: true });

      const setupPromise = presenter.handleSetup();

      // Verify loading state immediately
      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockView.disableSetupButton).toHaveBeenCalled();

      await setupPromise;
    });

    it('should send correct message to background script', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockResolvedValue({ success: true });

      await presenter.handleSetup();

      expect(sendMessageMock).toHaveBeenCalledWith({
        action: 'initializeMasterPassword',
        password: validPassword,
        confirmation: validPassword,
      });
    });

    it('should show success message and redirect on successful setup', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockResolvedValue({ success: true });

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      await presenter.handleSetup();

      expect(mockView.showMessage).toHaveBeenCalledWith(
        'masterPasswordSetup_successMessage',
        'success'
      );

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      expect(window.location.href).toBe('popup.html');
    });

    it('should show error message and re-enable button on setup failure', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockResolvedValue({ success: false, error: 'Setup failed' });

      await presenter.handleSetup();

      expect(mockView.showMessage).toHaveBeenCalledWith('Setup failed', 'error');
      expect(mockView.enableSetupButton).toHaveBeenCalled();
    });

    it('should handle chrome.runtime.sendMessage exception', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockRejectedValue(new Error('Message sending failed'));

      await presenter.handleSetup();

      expect(mockLogger.error).toHaveBeenCalledWith('Setup failed', { error: expect.any(Error) });
      expect(mockView.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('common_error'),
        'error'
      );
      expect(mockView.enableSetupButton).toHaveBeenCalled();
    });

    it('should always hide loading spinner in finally block', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockRejectedValue(new Error('Error'));

      await presenter.handleSetup();

      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should use default error message if response.error is undefined', async () => {
      mockView.getPassword.mockReturnValue(validPassword);
      mockView.getPasswordConfirm.mockReturnValue(validPassword);
      sendMessageMock.mockResolvedValue({ success: false, error: undefined });

      await presenter.handleSetup();

      expect(mockView.showMessage).toHaveBeenCalledWith('error_initializationFailed', 'error');
    });
  });
});
