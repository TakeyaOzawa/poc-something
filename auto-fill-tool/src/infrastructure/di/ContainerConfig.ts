/**
 * Container Configuration
 * DIコンテナの設定とサービス登録
 */

import { Container } from './Container';
import { TOKENS } from './ServiceTokens';

// Repositories
import { ChromeStorageXPathRepository } from '@infrastructure/repositories/ChromeStorageXPathRepository';
import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ChromeStorageSystemSettingsRepository } from '@infrastructure/repositories/ChromeStorageSystemSettingsRepository';
import { ChromeStorageAutomationResultRepository } from '@infrastructure/repositories/ChromeStorageAutomationResultRepository';

// Use Cases
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { DeleteWebsiteUseCase } from '@usecases/websites/DeleteWebsiteUseCase';
import { SaveWebsiteWithAutomationVariablesUseCase } from '@usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';

import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';

import { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import { SaveXPathUseCase } from '@usecases/xpaths/SaveXPathUseCase';
import { DeleteXPathUseCase } from '@usecases/xpaths/DeleteXPathUseCase';

import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';

// Adapters
import { ConsoleLogger } from '@infrastructure/loggers/ConsoleLogger';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { ChromeAutoFillAdapter } from '@infrastructure/adapters/ChromeAutoFillAdapter';

// Factories
import { UuidGenerator } from '@infrastructure/factories/UuidGenerator';

export class ContainerConfig {
  static configure(container: Container): void {
    // Repositories (Singleton)
    container.register(
      TOKENS.XPATH_REPOSITORY,
      () => new ChromeStorageXPathRepository(),
      'singleton'
    );

    container.register(
      TOKENS.WEBSITE_REPOSITORY,
      () => new ChromeStorageWebsiteRepository(),
      'singleton'
    );

    container.register(
      TOKENS.AUTOMATION_VARIABLES_REPOSITORY,
      () => new ChromeStorageAutomationVariablesRepository(),
      'singleton'
    );

    container.register(
      TOKENS.SYSTEM_SETTINGS_REPOSITORY,
      () => new ChromeStorageSystemSettingsRepository(),
      'singleton'
    );

    container.register(
      TOKENS.AUTOMATION_RESULT_REPOSITORY,
      () => new ChromeStorageAutomationResultRepository(),
      'singleton'
    );

    // Use Cases (Transient)
    container.register(
      TOKENS.GET_ALL_WEBSITES_USE_CASE,
      () => new GetAllWebsitesUseCase(container.resolve(TOKENS.WEBSITE_REPOSITORY))
    );

    container.register(
      TOKENS.DELETE_WEBSITE_USE_CASE,
      () => new DeleteWebsiteUseCase(container.resolve(TOKENS.WEBSITE_REPOSITORY))
    );

    container.register(
      TOKENS.SAVE_WEBSITE_WITH_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new SaveWebsiteWithAutomationVariablesUseCase(
          container.resolve(TOKENS.WEBSITE_REPOSITORY),
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY),
          container.resolve(TOKENS.ID_GENERATOR)
        )
    );

    // Automation Variables Use Cases
    container.register(
      TOKENS.GET_ALL_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new GetAllAutomationVariablesUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.GET_AUTOMATION_VARIABLES_BY_WEBSITE_ID_USE_CASE,
      () =>
        new GetAutomationVariablesByWebsiteIdUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.GET_AUTOMATION_VARIABLES_BY_ID_USE_CASE,
      () =>
        new GetAutomationVariablesByIdUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.SAVE_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new SaveAutomationVariablesUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.DELETE_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new DeleteAutomationVariablesUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.DUPLICATE_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new DuplicateAutomationVariablesUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY),
          container.resolve(TOKENS.ID_GENERATOR)
        )
    );

    container.register(
      TOKENS.EXPORT_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new ExportAutomationVariablesUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.IMPORT_AUTOMATION_VARIABLES_USE_CASE,
      () =>
        new ImportAutomationVariablesUseCase(
          container.resolve(TOKENS.AUTOMATION_VARIABLES_REPOSITORY)
        )
    );

    container.register(
      TOKENS.GET_LATEST_AUTOMATION_RESULT_USE_CASE,
      () =>
        new GetLatestAutomationResultUseCase(container.resolve(TOKENS.AUTOMATION_RESULT_REPOSITORY))
    );

    container.register(
      TOKENS.GET_AUTOMATION_RESULT_HISTORY_USE_CASE,
      () =>
        new GetAutomationResultHistoryUseCase(
          container.resolve(TOKENS.AUTOMATION_RESULT_REPOSITORY)
        )
    );

    // XPath Use Cases
    container.register(
      TOKENS.GET_ALL_XPATHS_USE_CASE,
      () => new GetAllXPathsUseCase(container.resolve(TOKENS.XPATH_REPOSITORY))
    );

    container.register(
      TOKENS.SAVE_XPATH_USE_CASE,
      () => new SaveXPathUseCase(container.resolve(TOKENS.XPATH_REPOSITORY))
    );

    container.register(
      TOKENS.DELETE_XPATH_USE_CASE,
      () => new DeleteXPathUseCase(container.resolve(TOKENS.XPATH_REPOSITORY))
    );

    // System Settings Use Cases
    container.register(
      TOKENS.GET_SYSTEM_SETTINGS_USE_CASE,
      () => new GetSystemSettingsUseCase(container.resolve(TOKENS.SYSTEM_SETTINGS_REPOSITORY))
    );

    container.register(
      TOKENS.UPDATE_SYSTEM_SETTINGS_USE_CASE,
      () => new UpdateSystemSettingsUseCase(container.resolve(TOKENS.SYSTEM_SETTINGS_REPOSITORY))
    );

    container.register(
      TOKENS.RESET_SYSTEM_SETTINGS_USE_CASE,
      () => new ResetSystemSettingsUseCase(container.resolve(TOKENS.SYSTEM_SETTINGS_REPOSITORY))
    );

    // Adapters (Singleton)
    container.register(TOKENS.LOGGER, () => new ConsoleLogger(), 'singleton');

    container.register(TOKENS.I18N_ADAPTER, () => I18nAdapter, 'singleton');

    container.register(
      TOKENS.CHROME_AUTO_FILL_ADAPTER,
      () => new ChromeAutoFillAdapter(container.resolve(TOKENS.LOGGER)),
      'singleton'
    );

    // Factories (Singleton)
    container.register(TOKENS.ID_GENERATOR, () => new UuidGenerator(), 'singleton');
  }
}
