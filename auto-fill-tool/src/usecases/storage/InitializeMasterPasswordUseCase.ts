/**
 * InitializeMasterPasswordUseCase
 * Initializes master password for secure storage
 * Use Case layer: Orchestration only, business logic in Domain
 */

import { Result } from '@domain/values/result.value';
import { MasterPasswordPolicy } from '@domain/entities/MasterPasswordPolicy';
import { SecureStorage } from '@domain/types/secure-storage-port.types';

export interface InitializeMasterPasswordInput {
  password: string;
  confirmation: string;
}

export class InitializeMasterPasswordUseCase {
  constructor(
    private readonly secureStorage: SecureStorage,
    private readonly policy: MasterPasswordPolicy = MasterPasswordPolicy.default()
  ) {}

  /**
   * Execute initialization
   * Returns Result<void> on success, Result with error on failure
   */
  async execute(input: InitializeMasterPasswordInput): Promise<Result<void>> {
    // 1. Validate password (Domain layer)
    const passwordValidation = this.policy.validatePassword(input.password);
    if (!passwordValidation.isValid) {
      return Result.failure(passwordValidation.errors.join('\n'));
    }

    // 2. Validate confirmation (Domain layer)
    const confirmationValidation = this.policy.validateConfirmation(
      input.password,
      input.confirmation
    );
    if (!confirmationValidation.isValid) {
      return Result.failure(confirmationValidation.errors.join('\n'));
    }

    // 3. Initialize secure storage (Infrastructure layer)
    const initResult = await this.secureStorage.initialize(input.password);
    if (initResult.isFailure) {
      return Result.failure(`Failed to initialize secure storage: ${initResult.error!.message}`);
    }

    return Result.success(undefined);
  }
}
