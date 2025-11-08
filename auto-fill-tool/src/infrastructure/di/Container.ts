/**
 * Dependency Injection Container
 * 軽量DIコンテナの実装
 */

export type ServiceLifecycle = 'singleton' | 'transient';
export type ServiceFactory<T = unknown> = () => T;

export interface ServiceRegistration<T = unknown> {
  factory: ServiceFactory<T>;
  lifecycle: ServiceLifecycle;
}

export interface Container {
  register<T>(token: string, factory: ServiceFactory<T>, lifecycle?: ServiceLifecycle): void;
  registerInstance<T>(token: string, instance: T): void;
  resolve<T>(token: string): T;
  has(token: string): boolean;
  clear(): void;
}

export class DIContainer implements Container {
  private services = new Map<string, ServiceRegistration>();
  private instances = new Map<string, unknown>();

  register<T>(
    token: string,
    factory: ServiceFactory<T>,
    lifecycle: ServiceLifecycle = 'transient'
  ): void {
    this.services.set(token, { factory, lifecycle });
  }

  registerInstance<T>(token: string, instance: T): void {
    this.instances.set(token, instance);
  }

  resolve<T>(token: string): T {
    // インスタンスが既に存在する場合
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    // サービス登録を確認
    const registration = this.services.get(token);
    if (!registration) {
      throw new Error(`Service not registered: ${token}`);
    }

    // インスタンス作成
    const instance = registration.factory();

    // Singletonの場合はインスタンスを保存
    if (registration.lifecycle === 'singleton') {
      this.instances.set(token, instance);
    }

    return instance;
  }

  has(token: string): boolean {
    return this.services.has(token) || this.instances.has(token);
  }

  clear(): void {
    this.services.clear();
    this.instances.clear();
  }
}
