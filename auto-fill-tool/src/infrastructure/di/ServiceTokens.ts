/**
 * Service Tokens for Dependency Injection
 * DIコンテナで使用するサービストークンの定義
 */

// Repositories
export const TOKENS = {
  // Repositories
  XPATH_REPOSITORY: 'XPathRepository',
  WEBSITE_REPOSITORY: 'WebsiteRepository',
  AUTOMATION_VARIABLES_REPOSITORY: 'AutomationVariablesRepository',
  SYSTEM_SETTINGS_REPOSITORY: 'SystemSettingsRepository',
  AUTOMATION_RESULT_REPOSITORY: 'AutomationResultRepository',
  STORAGE_SYNC_CONFIG_REPOSITORY: 'StorageSyncConfigRepository',
  TAB_RECORDING_REPOSITORY: 'TabRecordingRepository',

  // Use Cases - Websites
  GET_ALL_WEBSITES_USE_CASE: 'GetAllWebsitesUseCase',
  GET_WEBSITE_BY_ID_USE_CASE: 'GetWebsiteByIdUseCase',
  SAVE_WEBSITE_USE_CASE: 'SaveWebsiteUseCase',
  UPDATE_WEBSITE_USE_CASE: 'UpdateWebsiteUseCase',
  DELETE_WEBSITE_USE_CASE: 'DeleteWebsiteUseCase',
  SAVE_WEBSITE_WITH_AUTOMATION_VARIABLES_USE_CASE: 'SaveWebsiteWithAutomationVariablesUseCase',

  // Use Cases - Automation Variables
  GET_ALL_AUTOMATION_VARIABLES_USE_CASE: 'GetAllAutomationVariablesUseCase',
  GET_AUTOMATION_VARIABLES_BY_WEBSITE_ID_USE_CASE: 'GetAutomationVariablesByWebsiteIdUseCase',
  GET_AUTOMATION_VARIABLES_BY_ID_USE_CASE: 'GetAutomationVariablesByIdUseCase',
  SAVE_AUTOMATION_VARIABLES_USE_CASE: 'SaveAutomationVariablesUseCase',
  DELETE_AUTOMATION_VARIABLES_USE_CASE: 'DeleteAutomationVariablesUseCase',
  DUPLICATE_AUTOMATION_VARIABLES_USE_CASE: 'DuplicateAutomationVariablesUseCase',
  EXPORT_AUTOMATION_VARIABLES_USE_CASE: 'ExportAutomationVariablesUseCase',
  IMPORT_AUTOMATION_VARIABLES_USE_CASE: 'ImportAutomationVariablesUseCase',
  GET_LATEST_AUTOMATION_RESULT_USE_CASE: 'GetLatestAutomationResultUseCase',
  GET_AUTOMATION_RESULT_HISTORY_USE_CASE: 'GetAutomationResultHistoryUseCase',

  // Use Cases - XPath
  GET_ALL_XPATHS_USE_CASE: 'GetAllXPathsUseCase',
  SAVE_XPATH_USE_CASE: 'SaveXPathUseCase',
  UPDATE_XPATH_USE_CASE: 'UpdateXPathUseCase',
  DELETE_XPATH_USE_CASE: 'DeleteXPathUseCase',
  EXPORT_XPATH_USE_CASE: 'ExportXPathUseCase',
  IMPORT_XPATH_USE_CASE: 'ImportXPathUseCase',

  // Use Cases - Recording
  GET_LATEST_RECORDING_BY_VARIABLES_ID_USE_CASE: 'GetLatestRecordingByVariablesIdUseCase',

  // Use Cases - System Settings
  GET_SYSTEM_SETTINGS_USE_CASE: 'GetSystemSettingsUseCase',
  UPDATE_SYSTEM_SETTINGS_USE_CASE: 'UpdateSystemSettingsUseCase',
  RESET_SYSTEM_SETTINGS_USE_CASE: 'ResetSystemSettingsUseCase',
  EXPORT_SYSTEM_SETTINGS_USE_CASE: 'ExportSystemSettingsUseCase',
  IMPORT_SYSTEM_SETTINGS_USE_CASE: 'ImportSystemSettingsUseCase',

  // Adapters
  LOGGER: 'Logger',
  I18N_ADAPTER: 'I18nAdapter',
  CHROME_AUTO_FILL_ADAPTER: 'ChromeAutoFillAdapter',
  SECURE_STORAGE_ADAPTER: 'SecureStorageAdapter',

  // Factories
  ID_GENERATOR: 'IdGenerator',
} as const;

export type ServiceToken = (typeof TOKENS)[keyof typeof TOKENS];
