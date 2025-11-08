/**
 * Domain Layer: Command Base Interface
 * 全Commandクラス（UseCase）の共通インターフェース
 */

/**
 * Command基底インターフェース
 * 
 * @template TInput 入力パラメータの型
 * @template TOutput 出力結果の型
 */
export interface Command<TInput, TOutput> {
  /**
   * コマンドを実行する
   * 
   * @param input 入力パラメータ
   * @returns 実行結果
   */
  execute(input: TInput): Promise<TOutput>;
}

/**
 * 入力なしCommand基底インターフェース
 * 
 * @template TOutput 出力結果の型
 */
export interface NoInputCommand<TOutput> {
  /**
   * コマンドを実行する（入力なし）
   * 
   * @returns 実行結果
   */
  execute(): Promise<TOutput>;
}

/**
 * バッチCommand基底インターフェース
 * 
 * @template TInput 入力パラメータの型
 * @template TOutput 出力結果の型
 */
export interface BatchCommand<TInput, TOutput> {
  /**
   * 複数のコマンドを一括実行する
   * 
   * @param inputs 入力パラメータの配列
   * @returns 実行結果の配列
   */
  executeBatch(inputs: TInput[]): Promise<TOutput[]>;
}
