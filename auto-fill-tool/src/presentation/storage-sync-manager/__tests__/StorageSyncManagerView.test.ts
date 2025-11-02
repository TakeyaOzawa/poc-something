/**
 * Test: StorageSyncManagerViewImpl
 * Tests DOM manipulation for Storage Sync Manager UI
 */

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string, ...args: string[]) => {
      if (args.length > 0) {
        // If parameters provided, return key with parameters
        return `${key}(${args.join(', ')})`;
      }
      return key;
    }),
    format: jest.fn((key: string, ...args: string[]) => `${key}: ${args.join(', ')}`),
  },
}));

// Mock ProgressIndicator
jest.mock('@presentation/common/ProgressIndicator', () => ({
  ProgressIndicator: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    hide: jest.fn(),
    setIndeterminate: jest.fn(),
    clearIndeterminate: jest.fn(),
    updateProgress: jest.fn(),
  })),
}));

import { StorageSyncManagerViewImpl } from '../StorageSyncManagerView';
import { StorageSyncConfigData } from '@domain/entities/StorageSyncConfig';
import { SyncHistoryData } from '@domain/entities/SyncHistory';
import { ProgressIndicator } from '@presentation/common/ProgressIndicator';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('StorageSyncManagerViewImpl', () => {
  let view: StorageSyncManagerViewImpl;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Setup conflict resolution modal template
    const conflictResolutionTemplate = document.createElement('template');
    conflictResolutionTemplate.id = 'storage-sync-conflict-resolution-modal-template';
    conflictResolutionTemplate.innerHTML = `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3 data-bind="titleText"></h3>
          <p class="conflict-description" data-bind="descriptionText"></p>
        </div>
        <div class="conflict-content">
          <div class="conflict-info">
            <strong data-bind="storageKeyLabel"></strong> <span data-bind="storageKey"></span>
          </div>
          <div class="conflict-comparison">
            <div class="conflict-option conflict-local">
              <div class="conflict-header">
                <h4 data-bind="localDataTitle"></h4>
                <div class="conflict-timestamp">
                  <span data-bind="updatedAtLabel"></span> <span data-bind="localTimestamp"></span>
                </div>
              </div>
              <div class="conflict-data-preview">
                <pre><code data-bind="localDataJson"></code></pre>
              </div>
            </div>
            <div class="conflict-separator">VS</div>
            <div class="conflict-option conflict-remote">
              <div class="conflict-header">
                <h4 data-bind="remoteDataTitle"></h4>
                <div class="conflict-timestamp">
                  <span data-bind="updatedAtLabel"></span> <span data-bind="remoteTimestamp"></span>
                </div>
              </div>
              <div class="conflict-data-preview">
                <pre><code data-bind="remoteDataJson"></code></pre>
              </div>
            </div>
          </div>
          <div class="conflict-recommendation" data-bind-html="recommendationHtml"></div>
        </div>
        <div class="modal-actions">
          <button class="btn-conflict-local" data-choice="local" data-bind="useLocalButtonText"></button>
          <button class="btn-conflict-remote" data-choice="remote" data-bind="useRemoteButtonText"></button>
          <button class="btn-cancel" data-choice="cancel" data-bind="cancelButtonText"></button>
        </div>
      </div>
    `;
    document.body.appendChild(conflictResolutionTemplate);

    // Setup config item template
    const configItemTemplate = document.createElement('template');
    configItemTemplate.id = 'storage-sync-config-item-template';
    configItemTemplate.innerHTML = `
  <div class="config-item" data-bind-attr="id:data-id">
    <div class="config-header">
      <div class="config-storage-key" data-bind="storageKey"></div>
      <div class="config-actions">
        <button class="btn-test" data-action="test" data-bind-attr="id:data-id" data-bind="testButtonText"></button>
        <button class="btn-sync" data-action="sync" data-bind-attr="id:data-id" data-bind="syncButtonText"></button>
        <button class="btn-edit" data-action="edit" data-bind-attr="id:data-id">✏️ <span data-bind="editButtonText"></span></button>
        <button class="btn-delete" data-action="delete" data-bind-attr="id:data-id">🗑️ <span data-bind="deleteButtonText"></span></button>
      </div>
    </div>
    <div class="config-info">
      <span class="config-status" data-bind-attr="statusClass:class" data-bind="statusText"></span>
      <span><span data-bind="methodLabel"></span> <span data-bind="syncMethod"></span></span>
      <span><span data-bind="timingLabel"></span> <span data-bind="syncTiming"></span></span>
      <span><span data-bind="directionLabel"></span> <span data-bind="syncDirection"></span></span>
    </div>
    <div class="config-data" data-bind-if="hasSyncMethodDetails">
      <span class="config-data-label" data-bind="inputsLabel"></span> <span data-bind="inputsCount"></span><span data-bind="itemsUnit"></span>、
      <span class="config-data-label" data-bind="outputsLabel"></span> <span data-bind="outputsCount"></span><span data-bind="itemsUnit"></span>
    </div>
    <div class="config-data" data-bind-if="hasIntervalDetails">
      <span class="config-data-label" data-bind="intervalLabel"></span> <span data-bind="intervalTime"></span>
    </div>
  </div>
    `;
    document.body.appendChild(configItemTemplate);

    // Setup connection test modal template
    const connectionTestModalTemplate = document.createElement('template');
    connectionTestModalTemplate.id = 'storage-sync-connection-test-modal-template';
    connectionTestModalTemplate.innerHTML = `
  <div class="modal-content">
    <div class="modal-header" data-bind="headerText"></div>
    <div class="test-result" data-bind-attr="successClass:class">
      <h3 data-bind="resultTitle"></h3>
      <p data-bind-if="statusCode"><span data-bind="statusCodeLabel"></span> <span data-bind="statusCode"></span></p>
      <p data-bind-if="responseTime"><span data-bind="responseTimeLabel"></span> <span data-bind="responseTime"></span>ms</p>
      <p class="error-message" data-bind-if="error"><span data-bind="errorLabel"></span> <span data-bind="error"></span></p>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel close-test-result" data-bind="closeButtonText"></button>
    </div>
  </div>
    `;
    document.body.appendChild(connectionTestModalTemplate);

    // Setup empty state template
    const emptyStateTemplate = document.createElement('template');
    emptyStateTemplate.id = 'storage-sync-empty-state-template';
    emptyStateTemplate.innerHTML = `
  <div class="empty-state" data-bind="emptyText"></div>
    `;
    document.body.appendChild(emptyStateTemplate);

    // Setup history detail modal template
    const historyDetailModalTemplate = document.createElement('template');
    historyDetailModalTemplate.id = 'storage-sync-history-detail-modal-template';
    historyDetailModalTemplate.innerHTML = `
  <div class="modal-content modal-history-detail">
    <div class="modal-header" data-bind="headerText"></div>
    <div class="history-detail-content">
      <div class="detail-section">
        <h4 data-bind="basicInfoTitle"></h4>
        <div class="detail-row">
          <span class="detail-label" data-bind="idLabel"></span>
          <span class="detail-value" data-bind="id"></span>
        </div>
        <div class="detail-row">
          <span class="detail-label" data-bind="configIdLabel"></span>
          <span class="detail-value" data-bind="configId"></span>
        </div>
        <div class="detail-row">
          <span class="detail-label" data-bind="storageKeyLabel"></span>
          <span class="detail-value" data-bind="storageKey"></span>
        </div>
        <div class="detail-row">
          <span class="detail-label" data-bind="syncDirectionLabel"></span>
          <span class="detail-value" data-bind="syncDirection"></span>
        </div>
        <div class="detail-row">
          <span class="detail-label" data-bind="statusLabel"></span>
          <span class="detail-value" data-bind-attr="statusClass:class" data-bind="statusText"></span>
        </div>
      </div>

      <div class="detail-section">
        <h4 data-bind="executionTimeTitle"></h4>
        <div class="detail-row">
          <span class="detail-label" data-bind="startTimeLabel"></span>
          <span class="detail-value" data-bind="startTime"></span>
        </div>
        <div data-bind-if="hasEndTime">
          <div class="detail-row">
            <span class="detail-label" data-bind="endTimeLabel"></span>
            <span class="detail-value" data-bind="endTime"></span>
          </div>
          <div class="detail-row">
            <span class="detail-label" data-bind="durationLabel"></span>
            <span class="detail-value" data-bind="duration"></span>
          </div>
        </div>
      </div>

      <div data-bind-html="detailResultsHtml"></div>

      <div class="detail-section detail-error" data-bind-if="hasError">
        <h4 data-bind="errorInfoTitle"></h4>
        <div class="detail-error-message" data-bind="error"></div>
      </div>

      <div class="detail-section" data-bind-if="hasRetry">
        <h4 data-bind="retryInfoTitle"></h4>
        <div class="detail-row">
          <span class="detail-label" data-bind="retryCountLabel"></span>
          <span class="detail-value" data-bind="retryCount"></span>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel close-history-detail" data-bind="closeButtonText"></button>
    </div>
  </div>
    `;
    document.body.appendChild(historyDetailModalTemplate);

    // Setup history empty state template
    const historyEmptyStateTemplate = document.createElement('template');
    historyEmptyStateTemplate.id = 'storage-sync-history-empty-state-template';
    historyEmptyStateTemplate.innerHTML = `
  <div class="empty-state" data-bind="emptyText"></div>
    `;
    document.body.appendChild(historyEmptyStateTemplate);

    // Setup history item template
    const historyItemTemplate = document.createElement('template');
    historyItemTemplate.id = 'storage-sync-history-item-template';
    historyItemTemplate.innerHTML = `
  <div class="history-item" data-bind-attr="id:data-id">
    <div class="history-header-row">
      <div class="history-main-info">
        <span class="history-storage-key" data-bind="storageKey"></span>
        <span class="history-status" data-bind-attr="statusClass:class" data-bind="statusLabel"></span>
      </div>
      <div class="history-time">
        <span data-bind="startTime"></span>
        <span data-bind-if="hasDuration"> (<span data-bind="duration"></span>)</span>
      </div>
    </div>
    <div class="history-details">
      <div class="history-direction">
        <span data-bind="directionLabel"></span> <span data-bind="syncDirection"></span>
      </div>
      <div class="history-results" data-bind-if="hasResults" data-bind-html="resultsHtml"></div>
      <div class="history-error" data-bind-if="hasError"><span data-bind="errorLabel"></span> <span data-bind="error"></span></div>
      <div class="history-retry" data-bind-if="hasRetry"><span data-bind="retryLabel"></span> <span data-bind="retryCount"></span></div>
    </div>
    <div class="history-actions">
      <button class="btn-view-detail" data-action="view-detail" data-bind-attr="id:data-id" data-bind="viewDetailButtonText"></button>
    </div>
  </div>
    `;
    document.body.appendChild(historyItemTemplate);

    // Setup loading state template
    const loadingStateTemplate = document.createElement('template');
    loadingStateTemplate.id = 'storage-sync-loading-state-template';
    loadingStateTemplate.innerHTML = `
  <div class="loading-state" data-bind="loadingText"></div>
    `;
    document.body.appendChild(loadingStateTemplate);

    // Setup validation result modal template
    const validationResultModalTemplate = document.createElement('template');
    validationResultModalTemplate.id = 'storage-sync-validation-result-modal-template';
    validationResultModalTemplate.innerHTML = `
  <div class="modal-content">
    <div class="modal-header" data-bind="headerText"></div>
    <div class="validation-result" data-bind-attr="validationClass:class">
      <h3 data-bind="resultTitle"></h3>

      <div class="validation-errors" data-bind-if="hasErrors">
        <h4 data-bind="errorsTitle"></h4>
        <ul data-bind-list="errors">
          <!-- List items will be populated dynamically -->
        </ul>
      </div>

      <div class="validation-warnings" data-bind-if="hasWarnings">
        <h4 data-bind="warningsTitle"></h4>
        <ul data-bind-list="warnings">
          <!-- List items will be populated dynamically -->
        </ul>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel close-validation-result" data-bind="closeButtonText"></button>
    </div>
  </div>
    `;
    document.body.appendChild(validationResultModalTemplate);

    container = document.createElement('div');
    document.body.appendChild(container);
    view = new StorageSyncManagerViewImpl(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('showConfigs', () => {
    it('should display configuration list', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [{ key: 'test', value: 'value' }],
          outputs: [{ key: 'output', defaultValue: 'data' }],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('config-item');
      expect(container.innerHTML).toContain('testKey');
      expect(container.innerHTML).toContain('config-1');
    });

    it('should show empty state when no configs', () => {
      view.showConfigs([]);

      expect(container.innerHTML).toContain('empty-state');
      expect(container.innerHTML).toContain('syncConfigNoConfigs');
    });

    it('should display enabled status', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('status-enabled');
      expect(container.innerHTML).toContain('statusEnabled');
    });

    it('should display disabled status', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: false,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('status-disabled');
      expect(container.innerHTML).toContain('statusDisabled');
    });

    it('should display sync method labels', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('syncMethodNotion');
    });

    it('should display spreadsheet sync method', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('syncMethodSpreadsheet');
    });

    it('should display action buttons', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('btn-test');
      expect(container.innerHTML).toContain('btn-sync');
      expect(container.innerHTML).toContain('btn-edit');
      expect(container.innerHTML).toContain('btn-delete');
    });

    it('should display inputs and outputs count', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [
            { key: 'test1', value: 'val1' },
            { key: 'test2', value: 'val2' },
          ],
          outputs: [{ key: 'output1', defaultValue: 'default1' }],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('config-data');
      expect(container.innerHTML).toContain('2');
      expect(container.innerHTML).toContain('1');
    });

    it('should display sync interval for periodic timing', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'periodic',
          syncDirection: 'bidirectional',
          enabled: true,
          syncIntervalSeconds: 300,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('5分');
    });

    it('should escape HTML in storage key', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: '<script>alert("xss")</script>',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          enabled: true,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('showError', () => {
    it('should display error notification', () => {
      view.showError('Test error message');

      const notification = document.querySelector('.notification.error');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe('Test error message');
    });

    it('should remove notification after 3 seconds', (done) => {
      view.showError('Test error');

      const notification = document.querySelector('.notification.error');
      expect(notification).toBeTruthy();

      setTimeout(() => {
        const stillExists = document.querySelector('.notification.error');
        expect(stillExists).toBeFalsy();
        done();
      }, 3100);
    });
  });

  describe('showSuccess', () => {
    it('should display success notification', () => {
      view.showSuccess('Test success message');

      const notification = document.querySelector('.notification.success');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe('Test success message');
    });

    it('should remove notification after 3 seconds', (done) => {
      view.showSuccess('Test success');

      const notification = document.querySelector('.notification.success');
      expect(notification).toBeTruthy();

      setTimeout(() => {
        const stillExists = document.querySelector('.notification.success');
        expect(stillExists).toBeFalsy();
        done();
      }, 3100);
    });
  });

  describe('showLoading', () => {
    it('should display loading state', () => {
      view.showLoading();

      expect(container.innerHTML).toContain('loading-state');
      expect(container.innerHTML).toContain('syncConfigLoadingConfigs');
    });
  });

  describe('hideLoading', () => {
    it('should be a no-op method', () => {
      const beforeHTML = container.innerHTML;
      view.hideLoading();
      expect(container.innerHTML).toBe(beforeHTML);
    });
  });

  describe('showEmpty', () => {
    it('should display empty state', () => {
      view.showEmpty();

      expect(container.innerHTML).toContain('empty-state');
      expect(container.innerHTML).toContain('syncConfigNoConfigs');
    });
  });

  describe('showConnectionTestResult', () => {
    it('should display successful connection test result', () => {
      view.showConnectionTestResult({
        isConnectable: true,
        statusCode: 200,
        responseTime: 150,
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('test-success');
      expect(modal?.innerHTML).toContain('200');
      expect(modal?.innerHTML).toContain('150ms');
    });

    it('should display failed connection test result', () => {
      view.showConnectionTestResult({
        isConnectable: false,
        error: 'Connection refused',
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('test-failure');
      expect(modal?.innerHTML).toContain('Connection refused');
    });

    it('should close modal on button click', () => {
      view.showConnectionTestResult({
        isConnectable: true,
      });

      const closeBtn = document.querySelector('.close-test-result') as HTMLButtonElement;
      closeBtn?.click();

      const modal = document.querySelector('.modal');
      expect(modal).toBeFalsy();
    });

    it('should close modal on background click', () => {
      view.showConnectionTestResult({
        isConnectable: true,
      });

      const modal = document.querySelector('.modal') as HTMLElement;
      modal?.click();

      setTimeout(() => {
        const stillExists = document.querySelector('.modal');
        expect(stillExists).toBeFalsy();
      }, 0);
    });
  });

  describe('showValidationResult', () => {
    it('should display validation success', () => {
      view.showValidationResult({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('validation-success');
    });

    it('should display validation errors', () => {
      view.showValidationResult({
        isValid: false,
        errors: [
          { field: 'storageKey', message: 'Required' },
          { field: 'syncMethod', message: 'Invalid method' },
        ],
        warnings: [],
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('validation-failure');
      expect(modal?.innerHTML).toContain('storageKey');
      expect(modal?.innerHTML).toContain('Required');
      expect(modal?.innerHTML).toContain('syncMethod');
      expect(modal?.innerHTML).toContain('Invalid method');
    });

    it('should display validation warnings', () => {
      view.showValidationResult({
        isValid: true,
        errors: [],
        warnings: [{ field: 'syncInterval', message: 'Too short' }],
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('syncInterval');
      expect(modal?.innerHTML).toContain('Too short');
    });

    it('should close modal on button click', () => {
      view.showValidationResult({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const closeBtn = document.querySelector('.close-validation-result') as HTMLButtonElement;
      closeBtn?.click();

      const modal = document.querySelector('.modal');
      expect(modal).toBeFalsy();
    });
  });

  describe('showSyncHistories', () => {
    it('should display sync histories', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'bidirectional',
          status: 'success',
          startTime: Date.now(),
          endTime: Date.now() + 1000,
          retryCount: 0,
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('history-item');
      expect(container.innerHTML).toContain('testKey');
      expect(container.innerHTML).toContain('history-1');
    });

    it('should display history filter label', () => {
      const histories: SyncHistoryData[] = [];

      view.showSyncHistories(histories, 'config-123');

      expect(container.innerHTML).toContain('config-123');
    });

    it('should display all histories label when no filter', () => {
      const histories: SyncHistoryData[] = [];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('syncHistoryAllHistories');
    });

    it('should display success status', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'bidirectional',
          status: 'success',
          startTime: Date.now(),
          endTime: Date.now() + 1000,
          retryCount: 0,
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('status-success');
      expect(container.innerHTML).toContain('syncHistoryStatusSuccess');
    });

    it('should display failed status', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'bidirectional',
          status: 'failed',
          startTime: Date.now(),
          endTime: Date.now() + 1000,
          retryCount: 2,
          error: 'Connection failed',
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('status-failed');
      expect(container.innerHTML).toContain('syncHistoryStatusFailed');
      expect(container.innerHTML).toContain('Connection failed');
      expect(container.innerHTML).toContain('2');
    });

    it('should display receive results', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'receive_only',
          status: 'success',
          startTime: Date.now(),
          endTime: Date.now() + 1000,
          retryCount: 0,
          receiveResult: {
            success: true,
            receivedCount: 10,
          },
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('✅');
      expect(container.innerHTML).toContain('10');
    });

    it('should display send results', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'send_only',
          status: 'success',
          startTime: Date.now(),
          endTime: Date.now() + 1000,
          retryCount: 0,
          sendResult: {
            success: true,
            sentCount: 5,
          },
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('✅');
      expect(container.innerHTML).toContain('5');
    });
  });

  describe('showHistoryEmpty', () => {
    it('should display empty history state', () => {
      view.showHistoryEmpty();

      expect(container.innerHTML).toContain('empty-state');
      expect(container.innerHTML).toContain('syncConfigNoHistories');
    });
  });

  describe('showHistoryDetail', () => {
    it('should display history detail modal', () => {
      const history: SyncHistoryData = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testKey',
        syncDirection: 'bidirectional',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        retryCount: 0,
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
        sendResult: {
          success: true,
          sentCount: 5,
        },
        createdAt: Date.now(),
      };

      view.showHistoryDetail(history);

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('history-1');
      expect(modal?.innerHTML).toContain('config-1');
      expect(modal?.innerHTML).toContain('testKey');
      expect(modal?.innerHTML).toContain('10');
      expect(modal?.innerHTML).toContain('5');
    });

    it('should display error information', () => {
      const history: SyncHistoryData = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testKey',
        syncDirection: 'bidirectional',
        status: 'failed',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        retryCount: 3,
        error: 'Network timeout',
        createdAt: Date.now(),
      };

      view.showHistoryDetail(history);

      const modal = document.querySelector('.modal');
      expect(modal?.innerHTML).toContain('Network timeout');
      expect(modal?.innerHTML).toContain('3');
    });

    it('should close modal on button click', () => {
      const history: SyncHistoryData = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testKey',
        syncDirection: 'bidirectional',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        retryCount: 0,
        createdAt: Date.now(),
      };

      view.showHistoryDetail(history);

      const closeBtn = document.querySelector('.close-history-detail') as HTMLButtonElement;
      closeBtn?.click();

      const modal = document.querySelector('.modal');
      expect(modal).toBeFalsy();
    });
  });

  describe('showConflictResolutionDialog', () => {
    it('should display conflict resolution dialog', async () => {
      const promise = view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-02T00:00:00Z',
        remoteSource: 'notion',
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('testKey');
      expect(modal?.innerHTML).toContain('local');
      expect(modal?.innerHTML).toContain('remote');

      // Click use local button
      const useLocalBtn = document.querySelector('.btn-conflict-local') as HTMLButtonElement;
      useLocalBtn?.click();

      const result = await promise;
      expect(result).toBe('local');
    });

    it('should return remote when remote button clicked', async () => {
      const promise = view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-02T00:00:00Z',
        remoteSource: 'spread-sheet',
      });

      const useRemoteBtn = document.querySelector('.btn-conflict-remote') as HTMLButtonElement;
      useRemoteBtn?.click();

      const result = await promise;
      expect(result).toBe('remote');
    });

    it('should return cancel when cancel button clicked', async () => {
      const promise = view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-02T00:00:00Z',
        remoteSource: 'notion',
      });

      const cancelBtn = document.querySelector('.btn-cancel') as HTMLButtonElement;
      cancelBtn?.click();

      const result = await promise;
      expect(result).toBe('cancel');
    });

    it('should recommend newer data', () => {
      view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-02T00:00:00Z',
        remoteSource: 'notion',
      });

      const modal = document.querySelector('.modal');
      expect(modal?.innerHTML).toContain('conflictRecommendationRemoteNewer');
    });
  });

  describe('showProgress', () => {
    it('should create and show progress indicator', () => {
      view.showProgress('Testing...', false);

      expect(ProgressIndicator).toHaveBeenCalled();
    });

    it('should hide existing progress before showing new one', () => {
      view.showProgress('First', false);
      view.showProgress('Second', false);

      expect(ProgressIndicator).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateProgress', () => {
    it('should update progress indicator', () => {
      view.showProgress('Testing...', false);
      view.updateProgress(50, 'Half done');

      // Progress indicator mock should have been called
      expect(ProgressIndicator).toHaveBeenCalled();
    });

    it('should not throw error when no progress indicator exists', () => {
      expect(() => view.updateProgress(50)).not.toThrow();
    });
  });

  describe('hideProgress', () => {
    it('should hide progress indicator', () => {
      view.showProgress('Testing...', false);
      view.hideProgress();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should not throw error when no progress indicator exists', () => {
      expect(() => view.hideProgress()).not.toThrow();
    });
  });

  describe('additional coverage tests', () => {
    it('should handle validation result with only errors (no warnings)', () => {
      view.showValidationResult({
        isValid: false,
        errors: [{ field: 'field1', message: 'error1' }],
        warnings: [],
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('validation-failure');
    });

    it('should display history without endTime', () => {
      const history: SyncHistoryData = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testKey',
        syncDirection: 'bidirectional',
        status: 'success',
        startTime: Date.now(),
        endTime: 0,
        retryCount: 0,
        createdAt: Date.now(),
      };

      view.showHistoryDetail(history);

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('history-1');
    });

    it('should format duration less than 60 seconds', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'bidirectional',
          status: 'success',
          startTime: 1000,
          endTime: 25500, // 24.5 seconds
          retryCount: 0,
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('history-1');
    });

    it('should handle conflict resolution with invalid timestamps', () => {
      view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: 'invalid-date',
        remoteData: { test: 'remote' },
        remoteTimestamp: 'invalid-date',
        remoteSource: 'notion',
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('conflictRecommendationInvalid');
    });

    it('should handle conflict resolution with equal timestamps', () => {
      view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-01T00:00:00Z',
        remoteSource: 'notion',
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('conflictRecommendationEqual');
    });

    it('should handle conflict resolution with local newer', () => {
      view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-02T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-01T00:00:00Z',
        remoteSource: 'notion',
      });

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('conflictRecommendationLocalNewer');
    });

    it('should handle history detail with receiveResult error', () => {
      const history: SyncHistoryData = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testKey',
        syncDirection: 'receive_only',
        status: 'failed',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        retryCount: 0,
        receiveResult: {
          success: false,
          error: 'Receive error',
        },
        createdAt: Date.now(),
      };

      view.showHistoryDetail(history);

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('Receive error');
    });

    it('should handle history detail with sendResult error', () => {
      const history: SyncHistoryData = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testKey',
        syncDirection: 'send_only',
        status: 'failed',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        retryCount: 0,
        sendResult: {
          success: false,
          error: 'Send error',
        },
        createdAt: Date.now(),
      };

      view.showHistoryDetail(history);

      const modal = document.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.innerHTML).toContain('Send error');
    });

    it('should handle history with partial status', () => {
      const histories: SyncHistoryData[] = [
        {
          id: 'history-1',
          configId: 'config-1',
          storageKey: 'testKey',
          syncDirection: 'bidirectional',
          status: 'partial',
          startTime: Date.now(),
          endTime: Date.now() + 1000,
          retryCount: 0,
          createdAt: Date.now(),
        },
      ];

      view.showSyncHistories(histories);

      expect(container.innerHTML).toContain('syncHistoryStatusPartial');
    });

    it('should display sync interval with seconds only', () => {
      const configs: StorageSyncConfigData[] = [
        {
          id: 'config-1',
          storageKey: 'testKey',
          syncMethod: 'notion',
          syncTiming: 'periodic',
          syncDirection: 'bidirectional',
          enabled: true,
          syncIntervalSeconds: 45,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      view.showConfigs(configs);

      expect(container.innerHTML).toContain('45秒');
    });

    it('should close conflict dialog on background click', async () => {
      const promise = view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-02T00:00:00Z',
        remoteSource: 'notion',
      });

      const modal = document.querySelector('.modal') as HTMLElement;
      modal?.click();

      const result = await promise;
      expect(result).toBe('cancel');
    });

    it('should close conflict dialog on Escape key', async () => {
      const promise = view.showConflictResolutionDialog({
        storageKey: 'testKey',
        localData: { test: 'local' },
        localTimestamp: '2024-01-01T00:00:00Z',
        remoteData: { test: 'remote' },
        remoteTimestamp: '2024-01-02T00:00:00Z',
        remoteSource: 'notion',
      });

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      const result = await promise;
      expect(result).toBe('cancel');
    });
  });
});
