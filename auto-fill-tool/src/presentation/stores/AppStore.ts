/**
 * Alpine.js Store - グローバル状態管理
 *
 * このファイルはAlpine.jsのStoreを初期化し、アプリケーション全体で共有される状態を管理します。
 * 全HTMLファイルから`$store.app`でアクセス可能です。
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- AppStore interface is used for documentation purposes to define the structure of the Alpine.js store. While not directly referenced in TypeScript code, it serves as a type definition contract for developers using the store throughout the application.
interface AppStore {
  // Settings
  theme: 'light' | 'dark';
  language: string;

  // Notifications
  notifications: Notification[];

  // Loading state
  isLoading: boolean;

  // Methods
  setTheme(theme: 'light' | 'dark'): void;
  setLanguage(lang: string): void;
  showNotification(message: string, type?: 'success' | 'error' | 'info' | 'warning'): void;
  setLoading(loading: boolean): void;
}

/**
 * Alpine Storeを初期化
 */
export function initAppStore(): void {
  // @ts-expect-error - Alpine is loaded via CDN
  if (typeof Alpine === 'undefined') {
    console.warn('Alpine.js is not loaded yet. Store will be initialized when Alpine loads.');
    return;
  }

  // @ts-expect-error - Alpine is loaded via CDN
  Alpine.store('app', {
    // Settings
    theme: 'light' as 'light' | 'dark',
    language: 'ja',

    // Notifications
    notifications: [] as Notification[],

    // Loading state
    isLoading: false,

    // Methods
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');

      // Save to localStorage
      localStorage.setItem('app-theme', theme);
    },

    setLanguage(lang: string) {
      this.language = lang;

      // Trigger i18n update
      window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));

      // Save to localStorage
      localStorage.setItem('app-language', lang);
    },

    showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
      const id = Date.now();
      this.notifications.push({ id, message, type });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.notifications = this.notifications.filter((n: Notification) => n.id !== id);
      }, 5000);
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    // Initialize from localStorage
    init() {
      const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        this.setTheme(savedTheme);
      }

      const savedLanguage = localStorage.getItem('app-language');
      if (savedLanguage) {
        this.language = savedLanguage;
      }
    },
  });

  console.log('✅ Alpine Store initialized');
}

// Auto-initialize when Alpine is ready
if (typeof window !== 'undefined') {
  document.addEventListener('alpine:init', () => {
    initAppStore();
  });
}
