/**
 * ExecuteAutoFillUseCase
 * 自動入力を実行するユースケース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationResult } from '@domain/entities/AutomationResult';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
  loadByWebsiteId(websiteId: string): Promise<XPathCollection>;
}

export interface AutomationVariablesRepository {
  getById(id: string): Promise<AutomationVariables | undefined>;
}

export interface AutomationResultRepository {
  save(result: AutomationResult): Promise<void>;
  loadInProgress(websiteId: string): Promise<AutomationResult[]>;
}

export interface AutoFillService {
  executeAutoFillWithProgress(
    xpaths: XPathCollection,
    variables: AutomationVariables,
    result: AutomationResult
  ): Promise<void>;
}

export class ExecuteAutoFillUseCase {
  constructor(
    private xpathRepository: XPathRepository,
    private automationVariablesRepository: AutomationVariablesRepository,
    private automationResultRepository: AutomationResultRepository,
    private autoFillService: AutoFillService
  ) {}

  async execute(automationVariablesId: string): Promise<AutomationResult> {
    // 自動化変数を取得
    const variables = await this.automationVariablesRepository.getById(automationVariablesId);
    if (!variables) {
      throw new Error('自動化変数が見つかりません');
    }

    // 実行中の自動化があるかチェック
    const existingExecution = await this.checkExistingExecution(variables.getWebsiteId());
    if (existingExecution) {
      return await this.resumeExecution(existingExecution, variables);
    }

    // 新規実行を開始
    return await this.startNewExecution(variables);
  }

  private async checkExistingExecution(websiteId: string): Promise<AutomationResult | undefined> {
    const inProgressResults = await this.automationResultRepository.loadInProgress(websiteId);
    
    // 24時間以内の実行中状態のみを対象とする
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return inProgressResults.find(result => 
      new Date(result.getStartedAt()) > twentyFourHoursAgo
    );
  }

  private async resumeExecution(
    existingResult: AutomationResult,
    variables: AutomationVariables
  ): Promise<AutomationResult> {
    // XPath設定を取得
    const xpaths = await this.xpathRepository.loadByWebsiteId(variables.getWebsiteId());
    
    // 続きから実行
    await this.autoFillService.executeAutoFillWithProgress(xpaths, variables, existingResult);
    
    return existingResult;
  }

  private async startNewExecution(variables: AutomationVariables): Promise<AutomationResult> {
    // XPath設定を取得
    const xpaths = await this.xpathRepository.loadByWebsiteId(variables.getWebsiteId());
    
    if (xpaths.size() === 0) {
      throw new Error('XPath設定が見つかりません');
    }

    // 実行結果を作成
    const result = AutomationResult.create(
      variables.getId(),
      variables.getWebsiteId(),
      xpaths.size()
    );

    // 実行結果を保存
    await this.automationResultRepository.save(result);

    // 自動入力を実行
    await this.autoFillService.executeAutoFillWithProgress(xpaths, variables, result);

    return result;
  }
}
