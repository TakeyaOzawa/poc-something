/**
 * Presentation Layer: View Model Mapper
 * Maps domain entities to presentation view models
 */

import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { WebsiteViewModel } from '../types/WebsiteViewModel';
import { AutomationVariablesViewModel } from '../types/AutomationVariablesViewModel';
import { XPathViewModel } from '../types/XPathViewModel';

export class ViewModelMapper {
  static toWebsiteViewModel(data: WebsiteOutputDto): WebsiteViewModel {
    return {
      ...data, // WebsiteOutputDtoの全プロパティを継承
      displayName: data.name || '未設定',
      statusText:
        data.status === 'enabled' ? '有効' : data.status === 'disabled' ? '無効' : '1回のみ',
      lastUpdatedFormatted: new Date(data.updatedAt).toLocaleString(),
      canDelete: data.editable,
      canEdit: data.editable,
      canExecute: data.status === 'enabled' || data.status === 'once',
    };
  }

  static toAutomationVariablesViewModel(
    data: AutomationVariablesOutputDto
  ): AutomationVariablesViewModel {
    return {
      ...data, // AutomationVariablesOutputDtoの全プロパティを継承
      displayName: `変数セット ${data.id.slice(0, 8)}`,
      variableCount: Object.keys(data.variables).length,
      lastUpdatedFormatted: new Date(data.updatedAt).toLocaleString(),
      canEdit: true,
      canDelete: true,
      canDuplicate: true,
      canExecute: data.status === 'enabled' || data.status === 'once',
    };
  }

  static toXPathViewModel(data: XPathOutputDto): XPathViewModel {
    return {
      id: data.id,
      websiteId: data.websiteId,
      value: data.value,
      actionType: data.actionType,
      url: data.url,
      executionOrder: data.executionOrder,
      pathShort: data.pathShort || '',
      pathAbsolute: data.pathAbsolute || '',
      pathSmart: data.pathSmart || '',
      selectedPathPattern: data.selectedPathPattern || 'smart',
      afterWaitSeconds: data.afterWaitSeconds,
      executionTimeoutSeconds: data.executionTimeoutSeconds,
      retryType: data.retryType,
      actionPattern: data.actionPattern || '0',
      displayValue: data.value || '',
      actionTypeText: data.actionType || '',
      executionOrderText: String(data.executionOrder || 0),
      retryTypeText: String(data.retryType || 0),
      canEdit: true,
      canDelete: true,
      canDuplicate: true,
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
