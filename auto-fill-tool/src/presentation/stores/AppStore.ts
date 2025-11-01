/**
 * AppStore
 * アプリケーション全体の状態管理
 */

export interface AppState {
  isLoading: boolean;
  currentUser: string | null;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

export class AppStore {
  private state: AppState = {
    isLoading: false,
    currentUser: null,
    notifications: []
  };

  private listeners: Array<(state: AppState) => void> = [];

  getState(): AppState {
    return { ...this.state };
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  setLoading(isLoading: boolean): void {
    this.state.isLoading = isLoading;
    this.notifyListeners();
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    this.state.notifications.push(newNotification);
    this.notifyListeners();
  }

  removeNotification(id: string): void {
    this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export const appStore = new AppStore();
