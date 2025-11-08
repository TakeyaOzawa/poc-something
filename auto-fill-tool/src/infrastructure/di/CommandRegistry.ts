/**
 * Infrastructure: Command Registry
 * CommandDispatcherとDIコンテナの統合
 */

import { CommandDispatcher } from '@domain/commands/CommandDispatcher';
import { Container } from './Container';
import { TOKENS } from './ServiceTokens';

// Use Cases (Commands)
import { SaveWebsiteWithAutomationVariablesUseCase } from '@application/usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';
import { GetAllWebsitesUseCase } from '@application/usecases/websites/GetAllWebsitesUseCase';
import { GetSystemSettingsUseCase } from '@application/usecases/system-settings/GetSystemSettingsUseCase';

/**
 * Command Registry
 * DIコンテナからCommandDispatcherにコマンドを登録
 */
export class CommandRegistry {
  private dispatcher: CommandDispatcher;

  constructor(private container: Container) {
    this.dispatcher = new CommandDispatcher();
    this.registerCommands();
  }

  /**
   * コマンドを登録する
   */
  private registerCommands(): void {
    // Website Commands
    this.dispatcher.register(
      'saveWebsite',
      this.container.resolve<SaveWebsiteWithAutomationVariablesUseCase>(
        TOKENS.SAVE_WEBSITE_WITH_AUTOMATION_VARIABLES_USE_CASE
      )
    );

    this.dispatcher.register(
      'getAllWebsites',
      this.container.resolve<GetAllWebsitesUseCase>(TOKENS.GET_ALL_WEBSITES_USE_CASE)
    );

    // System Settings Commands
    this.dispatcher.register(
      'getSystemSettings',
      this.container.resolve<GetSystemSettingsUseCase>(TOKENS.GET_SYSTEM_SETTINGS_USE_CASE)
    );
  }

  /**
   * CommandDispatcherを取得
   */
  getDispatcher(): CommandDispatcher {
    return this.dispatcher;
  }

  /**
   * コマンドを実行
   */
  async execute<TOutput>(commandName: string, input?: unknown): Promise<TOutput> {
    return this.dispatcher.dispatch<TOutput>(commandName, input);
  }

  /**
   * 複数のコマンドを順次実行
   */
  async executeSequential(commands: Array<{ name: string; input?: unknown }>): Promise<unknown[]> {
    return this.dispatcher.dispatchSequential(commands);
  }

  /**
   * 複数のコマンドを並列実行
   */
  async executeParallel(commands: Array<{ name: string; input?: unknown }>): Promise<unknown[]> {
    return this.dispatcher.dispatchParallel(commands);
  }
}
