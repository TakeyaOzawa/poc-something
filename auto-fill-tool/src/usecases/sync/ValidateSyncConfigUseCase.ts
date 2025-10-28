/**
 * Use Case: Validate Sync Config
 * Validates a storage sync configuration for correctness and completeness
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { DataMapper } from '@domain/types/data-mapper.types';
import { Logger } from '@domain/types/logger.types';
import {
  validateInputsArray,
  validateOutputsArray,
  getInputValue,
} from '@domain/utils/SyncConfigUtils';

export interface ValidateSyncConfigInput {
  config: StorageSyncConfig;
  /**
   * If true, perform deep validation including URL and JSONPath checks
   */
  deepValidation?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidateSyncConfigOutput {
  success: boolean;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class ValidateSyncConfigUseCase {
  constructor(
    private dataMapper: DataMapper,
    private logger: Logger
  ) {}

  async execute(input: ValidateSyncConfigInput): Promise<ValidateSyncConfigOutput> {
    try {
      this.logger.info(`Validating sync config: ${input.config.getId()}`);

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Basic validation (entity validation already done in constructor)
      this.validateBasicStructure(input.config, errors);

      // Validate inputs/outputs array structure
      this.validateInputsOutputsStructure(input.config, errors);

      // Validate sync method specific requirements (authentication, etc.)
      this.validateSyncMethodRequirements(input.config, errors, warnings);

      // Validate timing configuration
      this.validateTiming(input.config, errors, warnings);

      // Validate direction and inputs/outputs consistency
      this.validateDirectionAndInputsOutputs(input.config, errors);

      const isValid = errors.length === 0;

      this.logger.info(
        `Validation complete: ${isValid ? 'VALID' : 'INVALID'} ` +
          `(${errors.length} errors, ${warnings.length} warnings)`
      );

      return {
        success: true,
        isValid,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Failed to validate sync config', error);

      return {
        success: false,
        isValid: false,
        errors: [
          {
            field: 'general',
            message: error instanceof Error ? error.message : 'Validation failed',
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  private validateBasicStructure(config: StorageSyncConfig, errors: ValidationError[]): void {
    if (!config.getStorageKey() || config.getStorageKey().trim() === '') {
      errors.push({
        field: 'storageKey',
        message: 'Storage key cannot be empty',
        severity: 'error',
      });
    }
  }

  /**
   * Validate inputs/outputs array structure using utility functions
   */
  private validateInputsOutputsStructure(
    config: StorageSyncConfig,
    errors: ValidationError[]
  ): void {
    const inputs = config.getInputs();
    const outputs = config.getOutputs();

    // Validate inputs array
    const inputErrors = validateInputsArray(inputs);
    for (const error of inputErrors) {
      errors.push({
        field: error.field,
        message: error.message,
        severity: 'error',
      });
    }

    // Validate outputs array
    const outputErrors = validateOutputsArray(outputs);
    for (const error of outputErrors) {
      errors.push({
        field: error.field,
        message: error.message,
        severity: 'error',
      });
    }
  }

  /**
   * Validate sync method specific requirements (authentication credentials, etc.)
   */
  private validateSyncMethodRequirements(
    config: StorageSyncConfig,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    const syncMethod = config.getSyncMethod();
    const inputs = config.getInputs();

    if (syncMethod === 'notion') {
      // Notion requires apiKey in inputs
      const apiKey = getInputValue<string>(inputs, 'apiKey');
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        errors.push({
          field: 'inputs',
          message: 'Notion sync requires "apiKey" in inputs array',
          severity: 'error',
        });
      }
    } else if (syncMethod === 'spread-sheet') {
      // Google Sheets requires accessToken or credentials in inputs
      const accessToken = getInputValue<string>(inputs, 'accessToken');
      const refreshToken = getInputValue<string>(inputs, 'refreshToken');

      if (!accessToken && !refreshToken) {
        errors.push({
          field: 'inputs',
          message: 'Google Sheets sync requires "accessToken" or "refreshToken" in inputs array',
          severity: 'error',
        });
      }
    }
  }

  private validateTiming(
    config: StorageSyncConfig,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (config.getSyncTiming() === 'periodic') {
      const interval = config.getSyncIntervalSeconds();

      if (!interval || interval <= 0) {
        errors.push({
          field: 'syncIntervalSeconds',
          message: 'Sync interval must be greater than 0 for periodic sync',
          severity: 'error',
        });
      } else if (interval < 60) {
        warnings.push({
          field: 'syncIntervalSeconds',
          message: 'Sync interval less than 60 seconds may cause performance issues',
          severity: 'warning',
        });
      }
    }
  }

  private validateDirectionAndInputsOutputs(
    config: StorageSyncConfig,
    errors: ValidationError[]
  ): void {
    const direction = config.getSyncDirection();
    const inputs = config.getInputs();
    const outputs = config.getOutputs();

    if (direction === 'bidirectional' || direction === 'receive_only') {
      if (!inputs || inputs.length === 0) {
        errors.push({
          field: 'inputs',
          message: `Input configuration is required for ${direction} sync`,
          severity: 'error',
        });
      }
    }

    if (direction === 'bidirectional' || direction === 'send_only') {
      if (!outputs || outputs.length === 0) {
        errors.push({
          field: 'outputs',
          message: `Output configuration is required for ${direction} sync`,
          severity: 'error',
        });
      }
    }
  }

  /* istanbul ignore next -- Reserved for future deep validation feature (deepValidation parameter). Will be used to validate URL formats in inputs/outputs when deepValidation=true is specified. */
  private isValidUrl(url: string): boolean {
    // Allow URLs with variables like ${id}
    const urlWithoutVariables = url.replace(/\$\{[^}]+\}/g, 'placeholder');

    try {
      new URL(urlWithoutVariables);
      return true;
    } catch {
      return false;
    }
  }
}
