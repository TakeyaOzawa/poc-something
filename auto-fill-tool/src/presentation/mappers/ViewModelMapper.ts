/**
 * Presentation Layer: View Model Mapper
 * Maps domain entities to presentation view models
 */

import { WebsiteData } from '@domain/entities/Website';
import { AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { XPathData } from '@domain/entities/XPathCollection';
import {
  WebsiteViewModel,
  AutomationVariablesViewModel,
  XPathViewModel,
} from '../types/website.viewmodel';

export class ViewModelMapper {
  static toWebsiteViewModel(data: WebsiteData): WebsiteViewModel {
    return {
      id: data.id,
      name: data.name,
      startUrl: data.startUrl,
      editable: data.editable,
      updatedAt: data.updatedAt,
    };
  }

  static toAutomationVariablesViewModel(
    data: AutomationVariablesData
  ): AutomationVariablesViewModel {
    return {
      id: data.id,
      websiteId: data.websiteId,
      variables: { ...data.variables },
      status: data.status,
      updatedAt: data.updatedAt,
    };
  }

  static toXPathViewModel(data: XPathData): XPathViewModel {
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
      executionOrder: data.executionOrder,
      executionTimeoutSeconds: data.executionTimeoutSeconds,
      url: data.url,
    };
  }

  static toWebsiteViewModels(dataArray: WebsiteData[]): WebsiteViewModel[] {
    return dataArray.map((data) => this.toWebsiteViewModel(data));
  }

  static toAutomationVariablesViewModels(
    dataArray: AutomationVariablesData[]
  ): AutomationVariablesViewModel[] {
    return dataArray.map((data) => this.toAutomationVariablesViewModel(data));
  }

  static toXPathViewModels(dataArray: XPathData[]): XPathViewModel[] {
    return dataArray.map((data) => this.toXPathViewModel(data));
  }
}
