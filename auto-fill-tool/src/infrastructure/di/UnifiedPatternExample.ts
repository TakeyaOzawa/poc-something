/**
 * Infrastructure: Unified Pattern Example
 * 統一化されたデザインパターンの使用例
 */

import { ApplicationService } from './ApplicationService';
import { Container } from './Container';
import { Observer } from '@domain/observers/Observer';
import { DomainEvent } from '@domain/events/DomainEvent';

/**
 * 統一化されたデザインパターンの使用例
 */
export class UnifiedPatternExample {
  private appService: ApplicationService;

  constructor() {
    const container = new Container();
    this.appService = new ApplicationService(container);
  }

  /**
   * Factory Pattern 統一化例
   */
  async factoryPatternExample(): Promise<void> {
    // ✅ 新しい統一インターフェース
    const websiteRepo = this.appService.createRepository('website');
    const logger = this.appService.createLogger('ExampleService');
    const xpathData = this.appService.createXPathData(['id', 'websiteId', 'value']);
    const xpathDataBatch = this.appService.createXPathDataBatch([
      ['id1', 'site1', 'value1'],
      ['id2', 'site2', 'value2']
    ]);

    console.log('Factory Pattern統一化完了', { websiteRepo, logger, xpathData, xpathDataBatch });

    // 🔄 従来のAPI（後方互換性保持）
    const repositoryFactory = this.appService.getRepositoryFactory();
    const legacyRepo = repositoryFactory.createWebsiteRepository();
    console.log('従来のAPI', { legacyRepo });
  }

  /**
   * Command Pattern 統一化例
   */
  async commandPatternExample(): Promise<void> {
    // ✅ 新しい統一インターフェース
    const websites = await this.appService.executeCommand('getAllWebsites');
    const systemSettings = await this.appService.executeCommand('getSystemSettings');

    // 複数コマンド並列実行
    const results = await this.appService.executeCommandsParallel([
      { name: 'getAllWebsites' },
      { name: 'getSystemSettings' }
    ]);

    console.log('Command Pattern統一化完了', { websites, systemSettings, results });

    // 🔄 従来のAPI（後方互換性保持）
    const commandRegistry = this.appService.getCommandRegistry();
    const legacyResult = await commandRegistry.execute('getAllWebsites');
    console.log('従来のAPI', { legacyResult });
  }

  /**
   * Observer Pattern 統一化例
   */
  async observerPatternExample(): Promise<void> {
    // ✅ 新しい統一インターフェース
    const observer: Observer<DomainEvent> = {
      update: async (event: DomainEvent) => {
        console.log('Observer received event:', event.eventType);
      }
    };

    const subscriptionId = this.appService.registerObserver('exampleObserver', observer);

    // イベント発行
    const event: DomainEvent = {
      eventId: 'test-event-1',
      eventType: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: 'test-aggregate'
    };

    await this.appService.publishEvent(event);

    console.log('Observer Pattern統一化完了', { subscriptionId });

    // 🔄 従来のAPI（後方互換性保持）
    const observerRegistry = this.appService.getObserverRegistry();
    const eventBus = observerRegistry.getEventBus();
    await eventBus.publish(event);
    console.log('従来のAPI使用完了');
  }

  /**
   * 統合使用例
   */
  async integratedExample(): Promise<void> {
    console.log('=== 統一化されたデザインパターン使用例 ===');

    // 1. Factory Pattern
    await this.factoryPatternExample();

    // 2. Command Pattern  
    await this.commandPatternExample();

    // 3. Observer Pattern
    await this.observerPatternExample();

    console.log('=== 全パターン統一化完了 ===');
  }
}

/**
 * 使用例の実行
 */
export async function runUnifiedPatternExample(): Promise<void> {
  const example = new UnifiedPatternExample();
  await example.integratedExample();
}
