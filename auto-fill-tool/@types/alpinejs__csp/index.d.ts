/**
 * Type definitions for @alpinejs/csp 3.x
 * Alpine.js with Content Security Policy (CSP) support
 */

declare module '@alpinejs/csp' {
  interface Alpine {
    /**
     * Start Alpine.js
     */
    start(): void;

    /**
     * Register a global Alpine data
     */
    data(name: string, callback: () => any): void;

    /**
     * Register a global Alpine store
     */
    store(name: string, data: any): void;

    /**
     * Register a custom directive
     */
    directive(name: string, callback: (el: HTMLElement, directive: any) => void): void;

    /**
     * Register a custom magic property
     */
    magic(name: string, callback: (el: HTMLElement) => any): void;

    /**
     * Register a plugin
     */
    plugin(callback: (alpine: Alpine) => void): void;
  }

  const Alpine: Alpine;
  export default Alpine;
}
