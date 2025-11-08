/**
 * Infrastructure: Observer Registry
 * EventBusとObserverの統合管理
 */

import { EventBus } from '@domain/events/EventBus';
import { Observer } from '@domain/observers/Observer';
import { DomainEvent } from '@domain/events/DomainEvent';
import { EventHandler } from '@domain/events/EventHandler';
import { LoggerFactory } from '@infrastructure/loggers/LoggerFactory';

/**
 * Observer Registry
 * EventBusとObserverの統合管理
 */
export class ObserverRegistry {
  private eventBus: EventBus;
  private observers: Map<string, Observer<DomainEvent>> = new Map();

  constructor() {
    const loggerFactory = new LoggerFactory();
    const logger = loggerFactory.create('EventBus');
    this.eventBus = new EventBus(logger);
  }

  /**
   * Observerを登録（新しいAPI）
   */
  registerObserver(name: string, observer: Observer<DomainEvent>): string {
    this.observers.set(name, observer);
    return this.eventBus.subscribe(observer);
  }

  /**
   * EventHandlerを登録（既存API互換）
   */
  registerEventHandler(eventType: string, handler: EventHandler): string {
    return this.eventBus.subscribe(eventType, handler);
  }

  /**
   * グローバルハンドラーを登録
   */
  registerGlobalHandler(handler: EventHandler): void {
    this.eventBus.subscribeToAll(handler);
  }

  /**
   * イベントを発行
   */
  async publish(event: DomainEvent): Promise<void> {
    return this.eventBus.publish(event);
  }

  /**
   * 複数のイベントを発行
   */
  async publishMany(events: DomainEvent[]): Promise<void> {
    return this.eventBus.publishMany(events);
  }

  /**
   * EventBusを取得
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * 登録されたObserver一覧を取得
   */
  getRegisteredObservers(): string[] {
    return Array.from(this.observers.keys());
  }

  /**
   * 購読を解除
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.eventBus.unsubscribe(subscriptionId);
  }

  /**
   * 全ての購読を解除
   */
  clearAll(): void {
    this.eventBus.clearAll();
    this.observers.clear();
  }
}
