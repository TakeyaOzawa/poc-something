/**
 * Global Container Instance
 * アプリケーション全体で使用するDIコンテナのシングルトンインスタンス
 */

import { DIContainer } from './Container';
import { ContainerConfig } from './ContainerConfig';

class GlobalContainerManager {
  private static instance: DIContainer | null = null;

  static getInstance(): DIContainer {
    if (!this.instance) {
      this.instance = new DIContainer();
      ContainerConfig.configure(this.instance);
    }
    return this.instance;
  }

  static reset(): void {
    if (this.instance) {
      this.instance.clear();
    }
    this.instance = null;
  }
}

// グローバルコンテナインスタンス
export const container = GlobalContainerManager.getInstance();

// テスト用のリセット関数
export const resetContainer = GlobalContainerManager.reset;
