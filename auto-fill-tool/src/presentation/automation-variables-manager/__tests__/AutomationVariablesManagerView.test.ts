/**
 * Unit Tests: AutomationVariablesManagerView
 */

/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */

import { AutomationVariablesManagerViewImpl } from '../AutomationVariablesManagerView';
import { AutomationVariablesViewModel } from '../AutomationVariablesManagerPresenter';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { TabRecording } from '@domain/entities/TabRecording';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        loading: '読み込み中...',
        noAutomationVariables: 'Automation Variables がありません',
        edit: '編集',
        duplicate: '複製',
        delete: '削除',
        statusEnabled: '有効',
        statusDisabled: '無効',
        statusOnce: '一回のみ',
        updatedAt: '更新日時',
        variables: '変数',
        noVariables: '変数なし',
        latestExecution: '最新実行',
        executionStatusSuccess: '成功',
        executionStatusFailure: '失敗',
        recordingPreview: '録画プレビュー',
        videoNotSupported: 'お使いのブラウザは動画再生に対応していません',
        recordingDuration: '録画時間',
        seconds: '秒',
        fileSize: 'ファイルサイズ',
        bitrate: 'ビットレート',
        noRecordingFound: '録画が見つかりません',
        previewRecording: '🎥 録画を見る',
      };
      return messages[key] || key;
    }),
    applyToDOM: jest.fn(),
  },
}));

const mockedI18nAdapter = I18nAdapter as jest.Mocked<typeof I18nAdapter>;

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('AutomationVariablesManagerView', () => {
  let view: AutomationVariablesManagerViewImpl;
  let container: HTMLElement;

  beforeAll(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  beforeEach(() => {
    // Setup container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Setup templates for TemplateLoader
    const itemTemplate = document.createElement('template');
    itemTemplate.id = 'automation-variables-item-template';
    itemTemplate.innerHTML = `
      <div class="variables-item" data-bind-attr="id:data-id">
        <div class="variables-header">
          <div class="variables-website" data-bind="websiteName"></div>
          <div class="variables-actions">
            <button class="btn-info" data-action="preview-recording" data-bind-attr="id:data-id" data-i18n="previewRecording">🎥 録画を見る</button>
            <button class="btn-warning" data-action="edit" data-bind-attr="id:data-id" data-i18n="edit">編集</button>
            <button class="btn-info" data-action="duplicate" data-bind-attr="id:data-id" data-i18n="duplicate">複製</button>
            <button class="btn-danger" data-action="delete" data-bind-attr="id:data-id" data-i18n="delete">削除</button>
          </div>
        </div>
        <div class="variables-info">
          <span class="variables-status" data-bind-attr="statusClass:class" data-bind="statusLabel"></span>
          <span><span data-bind="updatedAtLabel"></span> <span data-bind="updatedAt"></span></span>
        </div>
        <div class="variables-data">
          <span class="variables-data-label" data-bind="variablesLabel"></span>
          <span data-bind="variablesFormatted"></span>
        </div>
        <div class="variables-data" data-bind-if="hasLatestResult">
          <span class="variables-data-label" data-bind="latestExecutionLabel"></span>
          <span data-bind-attr="resultStatusClass:class" data-bind="resultStatusLabel"></span>
          <span data-bind-if="hasResultDetail"> - <span data-bind="resultDetail"></span></span>
          (<span data-bind="resultStartFrom"></span>)
        </div>
      </div>
    `;
    document.body.appendChild(itemTemplate);

    const loadingTemplate = document.createElement('template');
    loadingTemplate.id = 'automation-variables-loading-state-template';
    loadingTemplate.innerHTML = `
      <div class="loading-state" data-i18n="loading" data-bind="loadingText"></div>
    `;
    document.body.appendChild(loadingTemplate);

    const emptyTemplate = document.createElement('template');
    emptyTemplate.id = 'automation-variables-empty-state-template';
    emptyTemplate.innerHTML = `
      <div class="empty-state" data-i18n="noAutomationVariables" data-bind="emptyText"></div>
    `;
    document.body.appendChild(emptyTemplate);

    const modalTemplate = document.createElement('template');
    modalTemplate.id = 'automation-variables-recording-modal-template';
    modalTemplate.innerHTML = `
      <div class="recording-modal-content">
        <div class="recording-modal-header">
          <h3 data-bind="headerText"></h3>
          <button class="close-recording-modal">✖</button>
        </div>
        <div class="recording-modal-body">
          <video id="recordingVideo" controls width="100%">
            <source src="" data-bind-attr="mimeType:type">
            <span data-bind="videoNotSupported"></span>
          </video>
          <div class="recording-info">
            <p><span data-bind="durationLabel"></span> <span data-bind="duration"></span><span data-bind="secondsUnit"></span></p>
            <p><span data-bind="fileSizeLabel"></span> <span data-bind="fileSize"></span>MB</p>
            <p><span data-bind="bitrateLabel"></span> <span data-bind="bitrate"></span>Mbps</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalTemplate);

    view = new AutomationVariablesManagerViewImpl(container);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Clean up templates
    document.querySelectorAll('template').forEach((t) => t.remove());
    // Clean up any notifications
    document.querySelectorAll('.notification').forEach((n) => n.remove());
    // Clean up any modals
    document.querySelectorAll('.recording-modal').forEach((m) => m.remove());
  });

  describe('showVariables', () => {
    it('should display variables list with all information', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          websiteName: 'Test Website',
          variables: { username: 'test@example.com', password: 'secret' },
          status: AUTOMATION_STATUS.ENABLED,
          updatedAt: '2025-10-15T12:00:00.000Z',
          latestResult: {
            id: 'result-1',
            automationVariablesId: 'var-1',
            executionStatus: EXECUTION_STATUS.SUCCESS,
            resultDetail: 'Test success',
            startFrom: '2025-10-15T11:00:00.000Z',
            endTo: '2025-10-15T11:01:00.000Z',
            currentStepIndex: 0,
            totalSteps: 1,
            lastExecutedUrl: 'https://example.com',
          },
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('var-1');
      expect(container.innerHTML).toContain('Test Website');
      expect(container.innerHTML).toContain('username');
      expect(container.innerHTML).toContain('test@example.com');
      expect(container.innerHTML).toContain('編集');
      expect(container.innerHTML).toContain('複製');
      expect(container.innerHTML).toContain('削除');
    });

    it('should show empty state when no variables provided', () => {
      view.showVariables([]);

      expect(container.innerHTML).toContain('noAutomationVariables');
    });

    it('should display website ID when website name is not available', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('website-1');
    });

    it('should display enabled status correctly', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ENABLED,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('status-enabled');
      expect(container.innerHTML).toContain('有効');
    });

    it('should display disabled status correctly', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.DISABLED,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('status-disabled');
      expect(container.innerHTML).toContain('無効');
    });

    it('should display once status correctly', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('status-once');
      expect(container.innerHTML).toContain('一回のみ');
    });

    it('should display no variables message when variables object is empty', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('変数なし');
    });

    it('should display multiple variables correctly', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: { key1: 'value1', key2: 'value2', key3: 'value3' },
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('{{key1}}=value1');
      expect(container.innerHTML).toContain('{{key2}}=value2');
      expect(container.innerHTML).toContain('{{key3}}=value3');
    });

    it('should display latest result with success status', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
          latestResult: {
            id: 'result-1',
            automationVariablesId: 'var-1',
            executionStatus: EXECUTION_STATUS.SUCCESS,
            resultDetail: 'Success detail',
            startFrom: '2025-10-15T11:00:00.000Z',
            endTo: '2025-10-15T11:01:00.000Z',
            currentStepIndex: 0,
            totalSteps: 1,
            lastExecutedUrl: 'https://example.com',
          },
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('result-status-success');
      expect(container.innerHTML).toContain('成功');
      expect(container.innerHTML).toContain('Success detail');
    });

    it('should display latest result with failure status', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
          latestResult: {
            id: 'result-1',
            automationVariablesId: 'var-1',
            executionStatus: EXECUTION_STATUS.FAILED,
            resultDetail: 'Error occurred',
            startFrom: '2025-10-15T11:00:00.000Z',
            endTo: '2025-10-15T11:01:00.000Z',
            currentStepIndex: 0,
            totalSteps: 1,
            lastExecutedUrl: 'https://example.com',
          },
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('result-status-failure');
      expect(container.innerHTML).toContain('失敗');
      expect(container.innerHTML).toContain('Error occurred');
    });

    it('should not display latest result section when result is null', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
          latestResult: null,
        },
      ];

      view.showVariables(variables);

      // Check that the latest result div is hidden when result is null
      const latestResultDiv = container.querySelector(
        '[data-bind-if="hasLatestResult"]'
      ) as HTMLElement;
      expect(latestResultDiv).toBeTruthy();
      expect(latestResultDiv.style.display).toBe('none');
    });

    it('should escape HTML in variable names and values', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: { '<script>': '<img src=x>' },
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
      expect(container.innerHTML).not.toContain('<img src=x>');
      expect(container.innerHTML).toContain('&lt;img');
    });

    it('should escape HTML in website name', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          websiteName: '<img src=x onerror=alert(1)>',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).not.toContain('<img src=x');
      expect(container.innerHTML).toContain('&lt;img');
    });

    it('should call I18nAdapter.applyToDOM after rendering', () => {
      view.showVariables([]);

      expect(mockedI18nAdapter.applyToDOM).toHaveBeenCalledWith(container);
    });
  });

  describe('showError', () => {
    it('should display error notification', () => {
      view.showError('Test error message');

      const notification = document.querySelector('.notification.error');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe('Test error message');
    });

    it('should remove error notification after 3 seconds', () => {
      jest.useFakeTimers();

      view.showError('Test error');

      expect(document.querySelector('.notification.error')).toBeTruthy();

      jest.advanceTimersByTime(3000);

      expect(document.querySelector('.notification.error')).toBeFalsy();

      jest.useRealTimers();
    });
  });

  describe('showSuccess', () => {
    it('should display success notification', () => {
      view.showSuccess('Test success message');

      const notification = document.querySelector('.notification.success');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe('Test success message');
    });

    it('should remove success notification after 3 seconds', () => {
      jest.useFakeTimers();

      view.showSuccess('Test success');

      expect(document.querySelector('.notification.success')).toBeTruthy();

      jest.advanceTimersByTime(3000);

      expect(document.querySelector('.notification.success')).toBeFalsy();

      jest.useRealTimers();
    });
  });

  describe('showLoading', () => {
    it('should display loading state', () => {
      view.showLoading();

      expect(container.innerHTML).toContain('loading-state');
      expect(container.innerHTML).toContain('loading');
    });

    it('should call I18nAdapter.applyToDOM', () => {
      view.showLoading();

      expect(mockedI18nAdapter.applyToDOM).toHaveBeenCalledWith(container);
    });
  });

  describe('hideLoading', () => {
    it('should do nothing (no-op)', () => {
      const initialHTML = container.innerHTML;

      view.hideLoading();

      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe('showEmpty', () => {
    it('should display empty state', () => {
      view.showEmpty();

      expect(container.innerHTML).toContain('empty-state');
      expect(container.innerHTML).toContain('noAutomationVariables');
    });

    it('should call I18nAdapter.applyToDOM', () => {
      view.showEmpty();

      expect(mockedI18nAdapter.applyToDOM).toHaveBeenCalledWith(container);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined status correctly', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: undefined as any,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('status-once');
      expect(container.innerHTML).toContain('一回のみ');
    });

    it('should handle invalid date format gracefully', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: 'invalid-date',
        },
      ];

      view.showVariables(variables);

      // Should display "Invalid Date" when date parsing fails
      expect(container.innerHTML).toContain('Invalid Date');
    });

    it('should handle result detail as empty string', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: {},
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
          latestResult: {
            id: 'result-1',
            automationVariablesId: 'var-1',
            executionStatus: EXECUTION_STATUS.SUCCESS,
            resultDetail: '',
            startFrom: '2025-10-15T11:00:00.000Z',
            endTo: '2025-10-15T11:01:00.000Z',
            currentStepIndex: 0,
            totalSteps: 1,
            lastExecutedUrl: 'https://example.com',
          },
        },
      ];

      view.showVariables(variables);

      expect(container.innerHTML).toContain('成功');
      // Check that the result detail span is hidden when detail is empty
      const detailSpan = container.querySelector('[data-bind-if="hasResultDetail"]') as HTMLElement;
      expect(detailSpan).toBeTruthy();
      expect(detailSpan.style.display).toBe('none');
    });

    it('should handle special characters in variable values', () => {
      const variables: AutomationVariablesViewModel[] = [
        {
          id: 'var-1',
          websiteId: 'website-1',
          variables: { key: 'value with "quotes" & <tags>' },
          status: AUTOMATION_STATUS.ONCE,
          updatedAt: '2025-10-15T12:00:00.000Z',
        },
      ];

      view.showVariables(variables);

      // The escapeHtml method uses div.innerHTML which escapes & < > but not quotes
      expect(container.innerHTML).toContain('&amp;');
      expect(container.innerHTML).toContain('&lt;');
      expect(container.innerHTML).toContain('&gt;');
    });

    it('should handle multiple notifications simultaneously', () => {
      view.showError('Error 1');
      view.showSuccess('Success 1');
      view.showError('Error 2');

      const notifications = document.querySelectorAll('.notification');
      expect(notifications.length).toBe(3);
    });
  });

  describe(
    'showRecordingPreview',
    () => {
      it(
        'should display recording preview modal',
        () => {
          const blob = new Blob(['test video data'], { type: 'video/webm' });
          const recording = TabRecording.create({
            automationResultId: 'result-1',
            tabId: 1,
            bitrate: 2500000,
          })
            .start('test-recorder-id')
            .stop()
            .save(blob);

          view.showRecordingPreview(recording);

          const modal = document.querySelector('.recording-modal');
          expect(modal).toBeTruthy();
          expect(modal?.querySelector('#recordingVideo')).toBeTruthy();
          expect(modal?.querySelector('.close-recording-modal')).toBeTruthy();
          expect(mockedI18nAdapter.applyToDOM).toHaveBeenCalledWith(modal);
        },
        mockIdGenerator
      );

      it(
        'should display recording information',
        () => {
          const blob = new Blob(['a'.repeat(1000)], { type: 'video/webm' }, mockIdGenerator);
          const recording = TabRecording.create({
            automationResultId: 'result-1',
            tabId: 1,
            bitrate: 3000000,
          })
            .start('test-recorder-id')
            .stop()
            .save(blob);

          view.showRecordingPreview(recording);

          const modal = document.querySelector('.recording-modal');
          expect(modal?.textContent).toContain('録画時間');
          expect(modal?.textContent).toContain('秒');
          expect(modal?.textContent).toContain('ファイルサイズ');
          expect(modal?.textContent).toContain('ビットレート');
          expect(modal?.textContent).toContain('3.00Mbps');
        },
        mockIdGenerator
      );

      it(
        'should set video source when blob data is available',
        () => {
          const blob = new Blob(['test video data'], { type: 'video/webm' }, mockIdGenerator);
          const recording = TabRecording.create({
            automationResultId: 'result-1',
            tabId: 1,
            bitrate: 2500000,
          })
            .start('test-recorder-id')
            .stop()
            .save(blob);

          view.showRecordingPreview(recording);

          const videoElement = document.querySelector('#recordingVideo') as HTMLVideoElement;
          expect(videoElement.src).toBeTruthy();
          expect(videoElement.src).toContain('blob:');
        },
        mockIdGenerator
      );

      it(
        'should close modal when close button is clicked',
        () => {
          const blob = new Blob(['test video data'], { type: 'video/webm' }, mockIdGenerator);
          const recording = TabRecording.create({
            automationResultId: 'result-1',
            tabId: 1,
            bitrate: 2500000,
          })
            .start('test-recorder-id')
            .stop()
            .save(blob);

          view.showRecordingPreview(recording);

          const closeBtn = document.querySelector('.close-recording-modal') as HTMLButtonElement;
          closeBtn.click();

          expect(document.querySelector('.recording-modal')).toBeFalsy();
        },
        mockIdGenerator
      );

      it('should close modal when background is clicked', () => {
        const blob = new Blob(['test video data'], { type: 'video/webm' }, mockIdGenerator);
        const recording = TabRecording.create({
          automationResultId: 'result-1',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop()
          .save(blob);

        view.showRecordingPreview(recording);

        const modal = document.querySelector('.recording-modal') as HTMLElement;
        const clickEvent = new MouseEvent('click', { bubbles: true }, mockIdGenerator);
        Object.defineProperty(
          clickEvent,
          'target',
          { value: modal, enumerable: true },
          mockIdGenerator
        );
        modal.dispatchEvent(clickEvent);

        expect(document.querySelector('.recording-modal')).toBeFalsy();
      });

      it('should not close modal when modal content is clicked', () => {
        const blob = new Blob(['test video data'], { type: 'video/webm' });
        const recording = TabRecording.create({
          automationResultId: 'result-1',
          tabId: 1,
          bitrate: 2500000,
        })
          .start('test-recorder-id')
          .stop()
          .save(blob);

        view.showRecordingPreview(recording);

        const modalContent = document.querySelector('.recording-modal-content') as HTMLElement;
        const clickEvent = new MouseEvent('click', { bubbles: true }, mockIdGenerator);
        Object.defineProperty(
          clickEvent,
          'target',
          { value: modalContent, enumerable: true },
          mockIdGenerator
        );
        modalContent.dispatchEvent(clickEvent);

        expect(document.querySelector('.recording-modal')).toBeTruthy();
      });

      it(
        'should display video not supported message',
        () => {
          const blob = new Blob(['test video data'], { type: 'video/webm' });
          const recording = TabRecording.create({
            automationResultId: 'result-1',
            tabId: 1,
            bitrate: 2500000,
          })
            .start('test-recorder-id')
            .stop()
            .save(blob);

          view.showRecordingPreview(recording);

          const modal = document.querySelector('.recording-modal');
          expect(modal?.innerHTML).toContain('お使いのブラウザは動画再生に対応していません');
        },
        mockIdGenerator
      );

      it(
        'should handle recording without blob data',
        () => {
          const recording = TabRecording.create({
            automationResultId: 'result-1',
            tabId: 1,
            bitrate: 2500000,
          })
            .start('test-recorder-id')
            .stop();

          // Should not throw error
          expect(() => view.showRecordingPreview(recording)).not.toThrow();

          const modal = document.querySelector('.recording-modal');
          expect(modal).toBeTruthy();
        },
        mockIdGenerator
      );
    },
    mockIdGenerator
  );

  describe('showNoRecordingMessage', () => {
    it('should display no recording error message', () => {
      view.showNoRecordingMessage();

      const notification = document.querySelector('.notification.error');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe('録画が見つかりません');
    });

    it('should remove notification after 3 seconds', () => {
      jest.useFakeTimers();

      view.showNoRecordingMessage();

      expect(document.querySelector('.notification.error')).toBeTruthy();

      jest.advanceTimersByTime(3000);

      expect(document.querySelector('.notification.error')).toBeFalsy();

      jest.useRealTimers();
    });
  });
});
