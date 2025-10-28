/**
 * Presentation Layer: Tab Manager Component
 * Manages tab navigation and content display
 */

export interface TabConfig {
  tabId: string;
  tabButton: HTMLElement;
  contentElement: HTMLElement;
}

/**
 * TabManager - Generic tab management component
 *
 * Responsibilities:
 * - Register and manage multiple tabs
 * - Handle tab switching with visual feedback
 * - Support URL hash-based navigation
 * - Manage active tab state
 */
export class TabManager {
  private activeTab: string | null = null;
  private tabs: Map<string, HTMLElement> = new Map();
  private tabButtons: Map<string, HTMLElement> = new Map();

  constructor(
    private tabContainer: HTMLElement,
    private contentContainer: HTMLElement
  ) {
    if (!tabContainer) {
      throw new Error('Tab container element is required');
    }
    if (!contentContainer) {
      throw new Error('Content container element is required');
    }
  }

  /**
   * Register a new tab
   */
  registerTab(tabId: string, tabButton: HTMLElement, contentElement: HTMLElement): void {
    if (!tabId) {
      throw new Error('Tab ID is required');
    }
    if (!tabButton) {
      throw new Error('Tab button element is required');
    }
    if (!contentElement) {
      throw new Error('Content element is required');
    }
    if (this.tabs.has(tabId)) {
      throw new Error(`Tab with ID "${tabId}" is already registered`);
    }

    this.tabs.set(tabId, contentElement);
    this.tabButtons.set(tabId, tabButton);

    // Add click listener
    tabButton.addEventListener('click', () => this.switchTo(tabId));
  }

  /**
   * Switch to a specific tab
   */
  switchTo(tabId: string): void {
    if (!this.tabs.has(tabId)) {
      console.warn(`Tab "${tabId}" not found, ignoring switch request`);
      return;
    }

    // Hide all tabs and show the selected one
    this.tabs.forEach((content, id) => {
      if (id === tabId) {
        content.style.display = 'block';
        content.classList.add('active');
      } else {
        content.style.display = 'none';
        content.classList.remove('active');
      }
    });

    // Update button states
    this.updateTabButtons(tabId);

    // Update active tab
    this.activeTab = tabId;

    // Dispatch custom event for tab change
    this.dispatchTabChangeEvent(tabId);
  }

  /**
   * Get the currently active tab ID
   */
  getActiveTab(): string | null {
    return this.activeTab;
  }

  /**
   * Get all registered tab IDs
   */
  getTabIds(): string[] {
    return Array.from(this.tabs.keys());
  }

  /**
   * Check if a tab is registered
   */
  hasTab(tabId: string): boolean {
    return this.tabs.has(tabId);
  }

  /**
   * Unregister a tab
   */
  unregisterTab(tabId: string): void {
    const contentElement = this.tabs.get(tabId);

    if (contentElement) {
      contentElement.style.display = 'none';
      contentElement.classList.remove('active');
    }

    this.tabs.delete(tabId);
    this.tabButtons.delete(tabId);

    if (this.activeTab === tabId) {
      this.activeTab = null;
    }
  }

  /**
   * Update tab button visual states
   */
  private updateTabButtons(activeTabId: string): void {
    this.tabButtons.forEach((button, id) => {
      if (id === activeTabId) {
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
      }
    });
  }

  /**
   * Dispatch custom event when tab changes
   */
  private dispatchTabChangeEvent(tabId: string): void {
    const event = new CustomEvent('tabchange', {
      detail: { tabId, previousTab: this.activeTab },
      bubbles: true,
      cancelable: false,
    });
    this.contentContainer.dispatchEvent(event);
  }
}
