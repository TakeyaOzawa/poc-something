/**
 * Use Case: Save Website with Automation Variables
 * Handles the complex logic of saving or updating website with its automation variables
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { WebsiteData } from '@domain/entities/Website';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { SaveWebsiteUseCase } from './SaveWebsiteUseCase';
import { UpdateWebsiteUseCase } from './UpdateWebsiteUseCase';
import { GetWebsiteByIdUseCase } from './GetWebsiteByIdUseCase';
import { IdGenerator } from '@domain/types/id-generator.types';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { WebsiteMapper } from '@application/mappers/WebsiteMapper';

export interface SaveWebsiteWithAutomationVariablesInput {
  websiteId?: string;
  name: string;
  startUrl: string;
  status: (typeof AUTOMATION_STATUS)[keyof typeof AUTOMATION_STATUS];
  variables: Record<string, string>;
}

export interface SaveWebsiteWithAutomationVariablesOutput {
  success: boolean;
  website?: WebsiteOutputDto;
  error?: string;
}

export class SaveWebsiteWithAutomationVariablesUseCase {
  // eslint-disable-next-line max-params
  constructor(
    private websiteRepository: WebsiteRepository,
    private automationVariablesRepository: AutomationVariablesRepository,
    private saveWebsiteUseCase: SaveWebsiteUseCase,
    private updateWebsiteUseCase: UpdateWebsiteUseCase,
    private getWebsiteByIdUseCase: GetWebsiteByIdUseCase,
    private idGenerator: IdGenerator
  ) {}

  // eslint-disable-next-line max-lines-per-function, complexity -- Method handles two distinct workflows (update existing website vs create new website) with comprehensive error handling for each step. The sequential operations (get website, update/create, save automation variables) require proper validation and error messages at each stage, making both the line count and complexity necessary for robust operation.
  async execute(
    input: SaveWebsiteWithAutomationVariablesInput
  ): Promise<SaveWebsiteWithAutomationVariablesOutput> {
    let website: WebsiteData;

    if (input.websiteId) {
      // Update existing website
      const getResult = await this.getWebsiteByIdUseCase.execute({
        websiteId: input.websiteId,
      });

      if (!getResult.success || !getResult.website) {
        return {
          success: false,
          error: getResult.error || `Website not found: ${input.websiteId}`,
        };
      }

      const updateResult = await this.updateWebsiteUseCase.execute({
        websiteData: {
          ...getResult.website,
          name: input.name,
          startUrl: input.startUrl,
        },
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update website',
        };
      }

      website = {
        ...getResult.website,
        name: input.name,
        startUrl: input.startUrl,
      };
    } else {
      // Create new website
      const saveResult = await this.saveWebsiteUseCase.execute({
        name: input.name,
        editable: true,
        startUrl: input.startUrl,
      });

      if (!saveResult.success || !saveResult.website) {
        return {
          success: false,
          error: saveResult.error || 'Failed to save website',
        };
      }

      website = saveResult.website;
    }

    // Save or update automation variables
    const automationVarsResult = await this.automationVariablesRepository.load(website.id);
    if (automationVarsResult.isFailure) {
      return {
        success: false,
        error: `Failed to load automation variables: ${automationVarsResult.error?.message}`,
      };
    }

    let automationVars: AutomationVariables;
    if (automationVarsResult.value) {
      automationVars = automationVarsResult.value
        .setStatus(input.status)
        .setVariables(input.variables);
    } else {
      automationVars = AutomationVariables.create(
        {
          websiteId: website.id,
          status: input.status,
          variables: input.variables,
        },
        this.idGenerator
      );
    }

    const saveVarsResult = await this.automationVariablesRepository.save(automationVars);
    if (saveVarsResult.isFailure) {
      return {
        success: false,
        error: `Failed to save automation variables: ${saveVarsResult.error?.message}`,
      };
    }

    // DTOパターン: WebsiteDataをOutputDTOに変換
    const websiteDto = WebsiteMapper.toOutputDto(website);
    return {
      success: true,
      website: websiteDto,
    };
  }
}
