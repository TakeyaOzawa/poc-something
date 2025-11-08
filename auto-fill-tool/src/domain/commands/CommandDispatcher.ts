/**
 * Domain Layer: Command Dispatcher
 * コマンドの実行を管理・調整するディスパッチャー
 */

import { Command, NoInputCommand } from './Command';

/**
 * コマンドディスパッチャー
 * 複数のコマンドを管理し、実行順序や依存関係を制御する
 */
export class CommandDispatcher {
  private commands: Map<string, Command<unknown, unknown> | NoInputCommand<unknown>> = new Map();

  /**
   * コマンドを登録する
   *
   * @param name コマンド名
   * @param command コマンドインスタンス
   */
  register<TInput, TOutput>(
    name: string,
    command: Command<TInput, TOutput> | NoInputCommand<TOutput>
  ): void {
    this.commands.set(name, command as Command<unknown, unknown> | NoInputCommand<unknown>);
  }

  /**
   * 登録されたコマンドを実行する
   *
   * @param name コマンド名
   * @param input 入力パラメータ（NoInputCommandの場合は不要）
   * @returns 実行結果
   */
  async dispatch<TOutput>(name: string, input?: unknown): Promise<TOutput> {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Command not found: ${name}`);
    }

    // NoInputCommandかどうかを判定
    if ('execute' in command && command.execute.length === 0) {
      return (command as NoInputCommand<TOutput>).execute();
    }

    // 通常のCommandとして実行
    if (input === undefined) {
      throw new Error(`Input is required for command: ${name}`);
    }
    return (command as Command<unknown, TOutput>).execute(input);
  }

  /**
   * 複数のコマンドを順次実行する
   *
   * @param commands 実行するコマンドの配列 [{name, input?}]
   * @returns 実行結果の配列
   */
  async dispatchSequential(commands: Array<{ name: string; input?: unknown }>): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const cmd of commands) {
      const result = await this.dispatch(cmd.name, cmd.input);
      results.push(result);
    }
    return results;
  }

  /**
   * 複数のコマンドを並列実行する
   *
   * @param commands 実行するコマンドの配列 [{name, input?}]
   * @returns 実行結果の配列
   */
  async dispatchParallel(commands: Array<{ name: string; input?: unknown }>): Promise<unknown[]> {
    const promises = commands.map((cmd) => this.dispatch(cmd.name, cmd.input));
    return Promise.all(promises);
  }

  /**
   * 登録されているコマンド一覧を取得する
   *
   * @returns コマンド名の配列
   */
  getRegisteredCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * コマンドの登録を解除する
   *
   * @param name コマンド名
   */
  unregister(name: string): void {
    this.commands.delete(name);
  }

  /**
   * 全てのコマンドの登録を解除する
   */
  clear(): void {
    this.commands.clear();
  }
}
