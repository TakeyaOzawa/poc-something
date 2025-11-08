/**
 * Domain Layer: Factory Base Interface
 * 全Factoryクラスの共通インターフェース
 */

/**
 * Factory基底インターフェース
 *
 * @template T 生成するオブジェクトの型
 */
export interface Factory<T> {
  /**
   * オブジェクトを生成する
   *
   * @param params 生成に必要なパラメータ
   * @returns 生成されたオブジェクト
   */
  create(...params: unknown[]): T;
}

/**
 * 非同期Factory基底インターフェース
 *
 * @template T 生成するオブジェクトの型
 */
export interface AsyncFactory<T> {
  /**
   * オブジェクトを非同期で生成する
   *
   * @param params 生成に必要なパラメータ
   * @returns 生成されたオブジェクトのPromise
   */
  createAsync(...params: unknown[]): Promise<T>;
}

/**
 * 複数オブジェクト生成Factory基底インターフェース
 *
 * @template T 生成するオブジェクトの型
 */
export interface BatchFactory<T> {
  /**
   * 複数のオブジェクトを一括生成する
   *
   * @param items 生成に必要なパラメータの配列
   * @returns 生成されたオブジェクトの配列
   */
  createBatch(items: unknown[]): T[];
}
