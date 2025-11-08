/**
 * Infrastructure: Application Service
 * Factory、Command、Observerパターンの統合サービス
 */

import { Container } from './Container';
import { CommandRegistry } from './CommandRegistry';
import { ObserverRegistry } from './ObserverRegistry';
import { RepositoryFactory } from '@infrastructure/factories/RepositoryFactory';
import { LoggerFactory } from '@infrastructure/loggers/LoggerFactory';
import { XPathDataFactory } from '@domain/factories/XPathDataFactory';
import { Observer } from '@domain/observers/Observer';
import { DomainEvent } from '@domain/events/DomainEvent';

/**
 * Application Service
 * 全てのデザインパターンを統合したサービス
 */
export class ApplicationService {
  private container: Container;
  private commandRegistry: CommandRegistry;
  private observerRegistry: ObserverRegistry;
  private repositoryFactory: RepositoryFactory;
  private loggerFactory: LoggerFactory;
  private xpathDataFactory: XPathDataFactory;

  constructor(container: Container) {
    this.container = container;
    this.commandRegistry = new CommandRegistry(container);
    this.observerRegistry = new ObserverRegistry();
    this.repositoryFactory = new RepositoryFactory();
    this.loggerFactory = new LoggerFactory();
    this.xpathDataFactory = new XPathDataFactory();
  }

  /**
   * Command実行（統一インターフェース）
   */
  async executeCommand<TOutput>(commandName: string, input?: unknown): Promise<TOutput> {
    return this.commandRegistry.execute<TOutput>(commandName, input);
  }

  /**
   * 複数Command順次実行
   */
  async executeCommandsSequential(commands: Array<{name: string; input?: unknown}>): Promise<unknown[]> {
    return this.commandRegistry.executeSequential(commands);
  }

  /**
   * 複数Command並列実行
   */
  async executeCommandsParallel(commands: Array<{name: string; input?: unknown}>): Promise<unknown[]> {
    return this.commandRegistry.executeParallel(commands);
  }

  /**
   * Repository作成（統一インターフェース）
   */
  createRepository(repositoryType: string): unknown {
    return this.repositoryFactory.create(repositoryType);
  }

  /**
   * Logger作成（統一インターフェース）
   */
  createLogger(context: string): unknown {
    return this.loggerFactory.create(context);
  }

  /**
   * XPathData作成（統一インターフェース）
   */
  createXPathData(csvValues: string[]): unknown {
    return this.xpathDataFactory.create(csvValues);
  }

  /**
   * XPathData一括作成（統一インターフェース）
   */
  createXPathDataBatch(csvValuesList: string[][]): unknown[] {
    return this.xpathDataFactory.createBatch(csvValuesList);
  }

  /**
   * イベント発行（統一インターフェース）
   */
  async publishEvent(event: DomainEvent): Promise<void> {
    return this.observerRegistry.publish(event);
  }

  /**
   * Observer登録（統一インターフェース）
   */
  registerObserver(name: string, observer: Observer<DomainEvent>): string {
    return this.observerRegistry.registerObserver(name, observer);
  }

  /**
   * 従来のAPIアクセス（後方互換性）
   */
  getCommandRegistry(): CommandRegistry {
    return this.commandRegistry;
  }

  getObserverRegistry(): ObserverRegistry {
    return this.observerRegistry;
  }

  getRepositoryFactory(): RepositoryFactory {
    return this.repositoryFactory;
  }

  getLoggerFactory(): LoggerFactory {
    return this.loggerFactory;
  }

  getXPathDataFactory(): XPathDataFactory {
    return this.xpathDataFactory;
  }

  /**
   * DIコンテナアクセス
   */
  getContainer(): Container {
    return this.container;
  }
}
