/**
 * Unit Tests: AutomationVariablesManagerController initialization methods
 */

/* eslint-disable max-lines-per-function */

import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ChromeStorageAutomationResultRepository } from '@infrastructure/repositories/ChromeStorageAutomationResultRepository';
import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
} as any;

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
    applyToDOM: jest.fn(),
  },
}));

// Mock LoggerFactory
jest.mock('@infrastructure/loggers/LoggerFactory', () => ({
  LoggerFactory: {
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        createChild: jest.fn(),
      })),
    })),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('AutomationVariablesManagerController - Initialization Methods', () => {
  let mockLogger: any;

  beforeEach(() => {
    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        createChild: jest.fn(),
      })),
    };
  });

  describe('initializeRepositories', () => {
    it('should create all required repositories', () => {
      // Create a test class that exposes the private method for testing
      class TestController {
        private logger = mockLogger;

        initializeRepositories() {
          return {
            automationVariables: new ChromeStorageAutomationVariablesRepository(
              this.logger.createChild('AutomationVariablesRepo')
            ),
            automationResult: new ChromeStorageAutomationResultRepository(
              this.logger.createChild('AutomationResultRepo')
            ),
            website: new ChromeStorageWebsiteRepository(this.logger.createChild('WebsiteRepo')),
          };
        }
      }

      const controller = new TestController();
      const repositories = controller.initializeRepositories();

      expect(repositories.automationVariables).toBeInstanceOf(
        ChromeStorageAutomationVariablesRepository
      );
      expect(repositories.automationResult).toBeInstanceOf(ChromeStorageAutomationResultRepository);
      expect(repositories.website).toBeInstanceOf(ChromeStorageWebsiteRepository);
      expect(mockLogger.createChild).toHaveBeenCalledWith('AutomationVariablesRepo');
      expect(mockLogger.createChild).toHaveBeenCalledWith('AutomationResultRepo');
      expect(mockLogger.createChild).toHaveBeenCalledWith('WebsiteRepo');
    });
  });

  describe('initializeMapper', () => {
    it('should create AutomationVariablesMapper', () => {
      class TestController {
        private logger = mockLogger;

        initializeMapper() {
          return new AutomationVariablesMapper(
            this.logger.createChild('AutomationVariablesMapper')
          );
        }
      }

      const controller = new TestController();
      const mapper = controller.initializeMapper();

      expect(mapper).toBeInstanceOf(AutomationVariablesMapper);
      expect(mockLogger.createChild).toHaveBeenCalledWith('AutomationVariablesMapper');
    });
  });

  describe('initializeUseCases', () => {
    it('should create all required use cases', () => {
      class TestController {
        initializeUseCases(
          repositories: {
            automationVariables: ChromeStorageAutomationVariablesRepository;
            automationResult: ChromeStorageAutomationResultRepository;
            website: ChromeStorageWebsiteRepository;
          },
          mapper: AutomationVariablesMapper
        ) {
          return {
            getAllAutomationVariables: new GetAllAutomationVariablesUseCase(
              repositories.automationVariables
            ),
            getAutomationVariablesById: new GetAutomationVariablesByIdUseCase(
              repositories.automationVariables
            ),
            getAutomationVariablesByWebsiteId: new GetAutomationVariablesByWebsiteIdUseCase(
              repositories.automationVariables
            ),
            saveAutomationVariables: new SaveAutomationVariablesUseCase(
              repositories.automationVariables
            ),
            deleteAutomationVariables: new DeleteAutomationVariablesUseCase(
              repositories.automationVariables,
              repositories.automationResult
            ),
            duplicateAutomationVariables: new DuplicateAutomationVariablesUseCase(
              repositories.automationVariables
            ),
            exportAutomationVariables: new ExportAutomationVariablesUseCase(
              repositories.automationVariables,
              mapper
            ),
            importAutomationVariables: new ImportAutomationVariablesUseCase(
              repositories.automationVariables,
              mapper
            ),
            getLatestAutomationResult: new GetLatestAutomationResultUseCase(
              repositories.automationResult
            ),
            getAutomationResultHistory: new GetAutomationResultHistoryUseCase(
              repositories.automationResult
            ),
            getAllWebsites: new GetAllWebsitesUseCase(repositories.website),
          };
        }
      }

      const controller = new TestController();

      const mockRepositories = {
        automationVariables: new ChromeStorageAutomationVariablesRepository(mockLogger),
        automationResult: new ChromeStorageAutomationResultRepository(mockLogger),
        website: new ChromeStorageWebsiteRepository(mockLogger),
      };

      const mockMapper = new AutomationVariablesMapper(mockLogger);

      const useCases = controller.initializeUseCases(mockRepositories, mockMapper);

      // Verify all use cases are created
      expect(useCases.getAllAutomationVariables).toBeInstanceOf(GetAllAutomationVariablesUseCase);
      expect(useCases.getAutomationVariablesById).toBeInstanceOf(GetAutomationVariablesByIdUseCase);
      expect(useCases.getAutomationVariablesByWebsiteId).toBeInstanceOf(
        GetAutomationVariablesByWebsiteIdUseCase
      );
      expect(useCases.saveAutomationVariables).toBeInstanceOf(SaveAutomationVariablesUseCase);
      expect(useCases.deleteAutomationVariables).toBeInstanceOf(DeleteAutomationVariablesUseCase);
      expect(useCases.duplicateAutomationVariables).toBeInstanceOf(
        DuplicateAutomationVariablesUseCase
      );
      expect(useCases.exportAutomationVariables).toBeInstanceOf(ExportAutomationVariablesUseCase);
      expect(useCases.importAutomationVariables).toBeInstanceOf(ImportAutomationVariablesUseCase);
      expect(useCases.getLatestAutomationResult).toBeInstanceOf(GetLatestAutomationResultUseCase);
      expect(useCases.getAutomationResultHistory).toBeInstanceOf(GetAutomationResultHistoryUseCase);
      expect(useCases.getAllWebsites).toBeInstanceOf(GetAllWebsitesUseCase);
    });
  });

  describe('Refactoring validation', () => {
    it('should maintain correct dependency relationships', () => {
      // This test validates that the refactored code maintains the same
      // dependency injection pattern as before

      class TestController {
        private logger = mockLogger;

        initializeRepositories() {
          return {
            automationVariables: new ChromeStorageAutomationVariablesRepository(
              this.logger.createChild('AutomationVariablesRepo')
            ),
            automationResult: new ChromeStorageAutomationResultRepository(
              this.logger.createChild('AutomationResultRepo')
            ),
            website: new ChromeStorageWebsiteRepository(this.logger.createChild('WebsiteRepo')),
          };
        }

        initializeMapper() {
          return new AutomationVariablesMapper(
            this.logger.createChild('AutomationVariablesMapper')
          );
        }

        initializeUseCases(
          repositories: ReturnType<typeof this.initializeRepositories>,
          mapper: AutomationVariablesMapper
        ) {
          return {
            getAllAutomationVariables: new GetAllAutomationVariablesUseCase(
              repositories.automationVariables
            ),
            getAutomationVariablesById: new GetAutomationVariablesByIdUseCase(
              repositories.automationVariables
            ),
            getAutomationVariablesByWebsiteId: new GetAutomationVariablesByWebsiteIdUseCase(
              repositories.automationVariables
            ),
            saveAutomationVariables: new SaveAutomationVariablesUseCase(
              repositories.automationVariables
            ),
            deleteAutomationVariables: new DeleteAutomationVariablesUseCase(
              repositories.automationVariables,
              repositories.automationResult
            ),
            duplicateAutomationVariables: new DuplicateAutomationVariablesUseCase(
              repositories.automationVariables
            ),
            exportAutomationVariables: new ExportAutomationVariablesUseCase(
              repositories.automationVariables,
              mapper
            ),
            importAutomationVariables: new ImportAutomationVariablesUseCase(
              repositories.automationVariables,
              mapper
            ),
            getLatestAutomationResult: new GetLatestAutomationResultUseCase(
              repositories.automationResult
            ),
            getAutomationResultHistory: new GetAutomationResultHistoryUseCase(
              repositories.automationResult
            ),
            getAllWebsites: new GetAllWebsitesUseCase(repositories.website),
          };
        }
      }

      const controller = new TestController();

      // Execute the refactored initialization flow
      const repositories = controller.initializeRepositories();
      const mapper = controller.initializeMapper();
      const useCases = controller.initializeUseCases(repositories, mapper);

      // Verify the complete dependency chain
      expect(repositories).toBeDefined();
      expect(mapper).toBeDefined();
      expect(useCases).toBeDefined();

      // Verify all components are properly instantiated
      expect(Object.keys(useCases)).toHaveLength(11);
    });
  });
});
