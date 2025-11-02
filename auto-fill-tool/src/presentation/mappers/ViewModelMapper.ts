/**
 * Presentation Layer: View Model Mapper
 * Maps domain entities to presentation view models
 */

import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import {
  WebsiteViewModel,
  AutomationVariablesViewModel,
  XPathViewModel,
} from '../types/website.viewmodel';

export class ViewModelMapper {
  static toWebsiteViewModel(data: WebsiteOutputDto): WebsiteViewModel {
    return {
      id: data.id,
      name: data.name,
      startUrl: data.startUrl || undefined,
      editable: data.editable,
      updatedAt: data.updatedAt,
    };
  }

  static toAutomationVariablesViewModel(
    data: AutomationVariablesOutputDto
  ): AutomationVariablesViewModel {
    return {
      id: data.id,
      websiteId: data.websiteId,
      variables: { ...data.variables },
      status: data.status,
      updatedAt: data.updatedAt,
    };
  }

  static toXPathViewModel(data: XPathOutputDto): XPathViewModel {
    return {
      id: data.id,
      websiteId: data.websiteId,
      value: data.value,
      actionType: data.actionType,
      afterWaitSeconds: data.afterWaitSeconds,
      actionPattern: data.actionPattern,
      pathAbsolute: data.pathAbsolute,
      pathShort: data.pathShort,
      pathSmart: data.pathSmart,
      selectedPathPattern: data.selectedPathPattern,
      retryType: data.retryType,
      executionOrder: data.executionOrder || 0,
      executionTimeoutSeconds: data.executionTimeoutSeconds,
      url: data.url,
    };
  }

  static toWebsiteViewModels(dataArray: WebsiteOutputDto[]): WebsiteViewModel[] {
    return dataArray.map((data) => this.toWebsiteViewModel(data));
  }

  static toAutomationVariablesViewModels(
    dataArray: AutomationVariablesOutputDto[]
  ): AutomationVariablesViewModel[] {
    return dataArray.map((data) => this.toAutomationVariablesViewModel(data));
  }

  static toXPathViewModels(dataArray: XPathOutputDto[]): XPathViewModel[] {
    return dataArray.map((data) => this.toXPathViewModel(data));
  }
}
