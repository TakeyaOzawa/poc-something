import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

/**
 * Input DTO for DeleteWebsite UseCase
 */
export interface DeleteWebsiteInput {
  websiteId: string;
}

/**
 * Output DTO for DeleteWebsite UseCase
 */
export interface DeleteWebsiteOutput {
  success: boolean;
  error?: string;
}

/**
 * Use Case: Delete Website
 * Deletes a website and all its associated data (XPaths and AutomationVariables)
 */
export class DeleteWebsiteUseCase {
  constructor(
    private websiteRepository: WebsiteRepository,
    private xpathRepository: XPathRepository,
    private automationVariablesRepository: AutomationVariablesRepository
  ) {}

  // eslint-disable-next-line complexity -- Orchestrates cascading delete operation across three repositories (Website, XPath, AutomationVariables) with Result type error handling at each step. Complexity of 11 is due to multiple repository operations with error checking (load websites + isFailure check, save website + isFailure check, try-catch wrapper, load xpaths + isFailure check, forEach with filter, save xpaths + isFailure check, catch handler). The sequential error handling branches are necessary for data consistency and cannot be reduced without losing error specificity or atomicity of the delete operation.
  async execute(input: DeleteWebsiteInput): Promise<DeleteWebsiteOutput> {
    // Delete website
    const websiteLoadResult = await this.websiteRepository.load();
    if (websiteLoadResult.isFailure) {
      return {
        success: false,
        error: websiteLoadResult.error?.message || 'Failed to load websites',
      };
    }

    const websiteCollection = websiteLoadResult.value!;
    const newWebsiteCollection = websiteCollection.delete(input.websiteId);

    const websiteSaveResult = await this.websiteRepository.save(newWebsiteCollection);
    if (websiteSaveResult.isFailure) {
      return {
        success: false,
        error: websiteSaveResult.error?.message || 'Failed to delete website',
      };
    }

    // Delete associated XPaths
    try {
      const xpathLoadResult = await this.xpathRepository.load();
      if (xpathLoadResult.isFailure) {
        return {
          success: false,
          error: xpathLoadResult.error?.message || 'Failed to load xpaths',
        };
      }

      const xpathCollection = xpathLoadResult.value!;
      let newXPathCollection = xpathCollection;

      xpathCollection.getAll().forEach((xpath) => {
        if (xpath.websiteId === input.websiteId) {
          const deleteResult = newXPathCollection.delete(xpath.id);
          if (deleteResult.isSuccess) {
            newXPathCollection = deleteResult.value!;
          }
        }
      });

      const xpathSaveResult = await this.xpathRepository.save(newXPathCollection);
      if (xpathSaveResult.isFailure) {
        return {
          success: false,
          error: xpathSaveResult.error?.message || 'Failed to save xpaths',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete associated XPaths',
      };
    }

    // Delete associated AutomationVariables
    await this.automationVariablesRepository.delete(input.websiteId);

    return { success: true };
  }
}
