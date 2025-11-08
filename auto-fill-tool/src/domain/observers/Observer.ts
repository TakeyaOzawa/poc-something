/**
 * Domain Layer: Observer Base Interface
 * 全Observerクラスの共通インターフェース
 */

/**
 * Observer基底インターフェース
 *
 * @template TEvent 監視するイベントの型
 */
export interface Observer<TEvent> {
  /**
   * イベントを受信して処理する
   *
   * @param event 受信したイベント
   * @returns 処理結果のPromise
   */
  update(event: TEvent): Promise<void> | void;
}

/**
 * 非同期Observer基底インターフェース
 *
 * @template TEvent 監視するイベントの型
 */
export interface AsyncObserver<TEvent> {
  /**
   * イベントを非同期で処理する
   *
   * @param event 受信したイベント
   * @returns 処理結果のPromise
   */
  updateAsync(event: TEvent): Promise<void>;
}

/**
 * Subject基底インターフェース
 *
 * @template TEvent 発行するイベントの型
 */
export interface Subject<TEvent> {
  /**
   * Observerを登録する
   *
   * @param observer 登録するObserver
   * @returns 登録解除用のID
   */
  subscribe(observer: Observer<TEvent>): string;

  /**
   * Observerの登録を解除する
   *
   * @param observerId 登録解除するObserverのID
   */
  unsubscribe(observerId: string): void;

  /**
   * 全てのObserverにイベントを通知する
   *
   * @param event 通知するイベント
   */
  notify(event: TEvent): Promise<void>;
}

/**
 * 型安全なSubject基底インターフェース
 *
 * @template TEvent 発行するイベントの型
 */
export interface TypedSubject<TEvent> extends Subject<TEvent> {
  /**
   * イベントタイプを取得する
   *
   * @returns サポートするイベントタイプの配列
   */
  getSupportedEventTypes(): string[];
}
