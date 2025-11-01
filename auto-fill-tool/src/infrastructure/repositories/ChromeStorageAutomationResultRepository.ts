/**
 * ChromeStorageAutomationResultRepository
 * Chrome Storage APIを使用した自動化実行結果リポジトリの実装
 */

import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult, AutomationResultData } from '@domain/entities/AutomationResult';

export class ChromeStorageAutomationResultRepository implements AutomationResultRepository {
  private readonly STORAGE_KEY = 'AUTOMATION_RESULTS';

  async getAll(): Promise<AutomationResult[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as AutomationResultData[] | undefined;
      return data ? data.map(d => AutomationResult.fromData(d)) : [];
    } catch (error) {
      console.error('Failed to get automation results:', error);
      return [];
    }
  }

  async getById(id: string): Promise<AutomationResult | undefined> {
    const allResults = await this.getAll();
    return allResults.find(r => r.getId() === id);
  }

  async getByAutomationVariablesId(automationVariablesId: string): Promise<AutomationResult[]> {
    const allResults = await this.getAll();
    return allResults.filter(r => r.getAutomationVariablesId() === automationVariablesId);
  }

  async loadInProgress(websiteId: string): Promise<AutomationResult[]> {
    const allResults = await this.getAll();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return allResults.filter(result => 
      result.getWebsiteId() === websiteId &&
      result.isInProgress() &&
      new Date(result.getStartedAt()) > twentyFourHoursAgo
    );
  }

  async save(result: AutomationResult): Promise<void> {
    try {
      const allResults = await this.getAll();
      allResults.push(result);
      await this.saveAll(allResults);
    } catch (error) {
      console.error('Failed to save automation result:', error);
      throw new Error('自動化実行結果の保存に失敗しました');
    }
  }

  async update(result: AutomationResult): Promise<void> {
    try {
      const allResults = await this.getAll();
      const index = allResults.findIndex(r => r.getId() === result.getId());
      
      if (index === -1) {
        throw new Error('更新対象の自動化実行結果が見つかりません');
      }
      
      allResults[index] = result;
      await this.saveAll(allResults);
    } catch (error) {
      console.error('Failed to update automation result:', error);
      throw new Error('自動化実行結果の更新に失敗しました');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const allResults = await this.getAll();
      const index = allResults.findIndex(r => r.getId() === id);
      
      if (index === -1) {
        return false;
      }
      
      allResults.splice(index, 1);
      await this.saveAll(allResults);
      return true;
    } catch (error) {
      console.error('Failed to delete automation result:', error);
      throw new Error('自動化実行結果の削除に失敗しました');
    }
  }

  async deleteOldResults(olderThanDays: number): Promise<number> {
    try {
      const allResults = await this.getAll();
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const filteredResults = allResults.filter(result => 
        new Date(result.getStartedAt()) > cutoffDate
      );
      
      const deletedCount = allResults.length - filteredResults.length;
      
      if (deletedCount > 0) {
        await this.saveAll(filteredResults);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to delete old automation results:', error);
      throw new Error('古い自動化実行結果の削除に失敗しました');
    }
  }

  private async saveAll(results: AutomationResult[]): Promise<void> {
    const data = results.map(r => r.toData());
    await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
  }
}
