/**
 * ChromeStorageAutomationVariablesRepository
 * Chrome Storage APIを使用した自動化変数リポジトリの実装
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';

export class ChromeStorageAutomationVariablesRepository implements AutomationVariablesRepository {
  private readonly STORAGE_KEY = 'AUTOMATION_VARIABLES';

  async getAll(): Promise<AutomationVariables[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as AutomationVariablesData[] | undefined;
      return data ? data.map(d => AutomationVariables.fromData(d)) : [];
    } catch (error) {
      console.error('Failed to get automation variables:', error);
      return [];
    }
  }

  async getById(id: string): Promise<AutomationVariables | undefined> {
    const allVariables = await this.getAll();
    return allVariables.find(v => v.getId() === id);
  }

  async getByWebsiteId(websiteId: string): Promise<AutomationVariables[]> {
    const allVariables = await this.getAll();
    return allVariables.filter(v => v.getWebsiteId() === websiteId);
  }

  async save(variables: AutomationVariables): Promise<void> {
    try {
      const allVariables = await this.getAll();
      allVariables.push(variables);
      await this.saveAll(allVariables);
    } catch (error) {
      console.error('Failed to save automation variables:', error);
      throw new Error('自動化変数の保存に失敗しました');
    }
  }

  async update(variables: AutomationVariables): Promise<void> {
    try {
      const allVariables = await this.getAll();
      const index = allVariables.findIndex(v => v.getId() === variables.getId());
      
      if (index === -1) {
        throw new Error('更新対象の自動化変数が見つかりません');
      }
      
      allVariables[index] = variables;
      await this.saveAll(allVariables);
    } catch (error) {
      console.error('Failed to update automation variables:', error);
      throw new Error('自動化変数の更新に失敗しました');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const allVariables = await this.getAll();
      const index = allVariables.findIndex(v => v.getId() === id);
      
      if (index === -1) {
        return false;
      }
      
      allVariables.splice(index, 1);
      await this.saveAll(allVariables);
      return true;
    } catch (error) {
      console.error('Failed to delete automation variables:', error);
      throw new Error('自動化変数の削除に失敗しました');
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear automation variables:', error);
      throw new Error('自動化変数のクリアに失敗しました');
    }
  }

  private async saveAll(variables: AutomationVariables[]): Promise<void> {
    const data = variables.map(v => v.toData());
    await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
  }
}
