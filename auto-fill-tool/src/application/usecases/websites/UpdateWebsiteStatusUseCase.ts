import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationStatus } from '@domain/constants/AutomationStatus';
import { IdGenerator } from '@domain/types/id-generator.types';

/**
 * Input DTO for UpdateWebsiteStatus UseCase
 */
export interface UpdateWebsiteStatusInput {
  websiteId: string;
  status: AutomationStatus;
}

/**
 * Output DTO for UpdateWebsiteStatus UseCase
 */
export interface UpdateWebsiteStatusOutput {
  success: boolean;
  error?: string;
}

/**
 * Use Case: Update Website Status
 * Updates the automation status of a website
 */
export class UpdateWebsiteStatusUseCase {
  constructor(
    private websiteRepository: WebsiteRepository,
    private automationVariablesRepository: AutomationVariablesRepository,
    private idGenerator: IdGenerator
  ) {}

  async execute(input: UpdateWebsiteStatusInput): Promise<UpdateWebsiteStatusOutput> {
    // Verify website exists
    const loadResult = await this.websiteRepository.load();
    if (loadResult.isFailure) {
      return {
        success: false,
        error: loadResult.error?.message || 'Failed to load websites',
      };
    }

    const collection = loadResult.value!;
    const website = collection.getById(input.websiteId);

    if (!website) {
      return {
        success: false,
        error: `Website not found: ${input.websiteId}`,
      };
    }

    // Load or create automation variables
    const variablesResult = await this.automationVariablesRepository.load(input.websiteId);
    if (variablesResult.isFailure) {
      return {
        success: false,
        error: `Failed to load automation variables: ${variablesResult.error?.message ?? 'Unknown error'}`,
      };
    }

    let variables: AutomationVariables;
    if (!variablesResult.value) {
      variables = AutomationVariables.create(
        {
          websiteId: input.websiteId,
          status: input.status,
        },
        this.idGenerator
      );
    } else {
      variables = variablesResult.value.setStatus(input.status);
    }

    // Save automation variables
    const saveResult = await this.automationVariablesRepository.save(variables);
    if (saveResult.isFailure) {
      return {
        success: false,
        error: `Failed to save automation variables: ${saveResult.error?.message ?? 'Unknown error'}`,
      };
    }

    return { success: true };
  }
}
