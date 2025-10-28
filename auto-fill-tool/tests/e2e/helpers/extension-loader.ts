/**
 * Chrome Extension Testing Helper
 *
 * Provides utilities for loading and testing Chrome extensions with Playwright.
 * Includes timeout handling, retry logic, and detailed logging for debugging.
 *
 * @version 4.1.0 - Enhanced for Chrome Extension Manifest V3
 */

import { chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

export interface ExtensionContext {
  context: BrowserContext;
  extensionId: string;
  popupPage: Page;
}

/**
 * Configuration for extension loading
 */
interface LoadExtensionOptions {
  timeout?: number; // Overall timeout in milliseconds (default: 60000)
  retries?: number; // Number of retry attempts (default: 2)
  headless?: boolean; // Headless mode (default: false, not recommended for extensions)
  debug?: boolean; // Enable detailed debug logging (default: false)
}

/**
 * Default options for extension loading
 */
const DEFAULT_OPTIONS: LoadExtensionOptions = {
  timeout: 60000,
  retries: 2,
  headless: false,
  debug: process.env.DEBUG === 'true',
};

/**
 * Log with timestamp for debugging
 */
function log(message: string, options: LoadExtensionOptions): void {
  if (options.debug) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ExtensionLoader] ${message}`);
  }
}

/**
 * Measure execution time of an async function
 */
async function measureTime<T>(
  fn: () => Promise<T>,
  label: string,
  options: LoadExtensionOptions
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    log(`${label} completed in ${duration}ms`, options);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log(`${label} failed after ${duration}ms: ${error}`, options);
    throw error;
  }
}

/**
 * Load Chrome extension with retry logic and detailed logging
 */
export async function loadExtension(
  userOptions: LoadExtensionOptions = {}
): Promise<ExtensionContext> {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  log('Starting extension loading process', options);

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= options.retries!; attempt++) {
    if (attempt > 0) {
      log(`Retry attempt ${attempt}/${options.retries}`, options);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s wait between retries
    }

    try {
      return await measureTime(
        async () => await loadExtensionInternal(options),
        `Extension loading (attempt ${attempt + 1}/${options.retries! + 1})`,
        options
      );
    } catch (error) {
      lastError = error as Error;
      log(`Attempt ${attempt + 1} failed: ${error}`, options);
    }
  }

  throw new Error(
    `Failed to load extension after ${options.retries! + 1} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Internal function for loading extension (single attempt)
 */
async function loadExtensionInternal(
  options: LoadExtensionOptions
): Promise<ExtensionContext> {
  const extensionPath = path.join(__dirname, '../../../dist');
  log(`Extension path: ${extensionPath}`, options);

  // Step 1: Launch browser with extension
  log('Step 1: Launching browser with extension', options);
  const context = await measureTime(
    async () =>
      await chromium.launchPersistentContext('', {
        headless: options.headless,
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      }),
    'Browser launch',
    options
  );

  try {
    // Step 2: Wait for Service Worker (Manifest V3)
    log('Step 2: Waiting for Service Worker initialization', options);
    await measureTime(
      async () => await waitForServiceWorker(context, options),
      'Service Worker initialization',
      options
    );

    // Step 3: Get extension ID
    log('Step 3: Getting extension ID', options);
    const extensionId = await measureTime(
      async () => await getExtensionId(context, options),
      'Extension ID retrieval',
      options
    );
    log(`Extension ID: ${extensionId}`, options);

    // Step 4: Open popup page
    log('Step 4: Opening popup page', options);
    const popupPage = await measureTime(
      async () => await openPopupPage(context, extensionId, options),
      'Popup page opening',
      options
    );

    // Step 5: Wait for Alpine.js initialization
    log('Step 5: Waiting for Alpine.js initialization', options);
    await measureTime(
      async () => await waitForAlpine(popupPage, options.timeout),
      'Alpine.js initialization',
      options
    );

    log('Extension loading completed successfully', options);
    return { context, extensionId, popupPage };
  } catch (error) {
    // Cleanup on failure
    log('Error occurred, cleaning up context', options);
    await context.close().catch(() => {});
    throw error;
  }
}

/**
 * Wait for Service Worker to be ready (Manifest V3)
 *
 * Note: Service Workers don't emit 'page' events like background pages.
 * Instead, we wait for the extension to load by checking for chrome-extension:// pages.
 */
async function waitForServiceWorker(
  context: BrowserContext,
  options: LoadExtensionOptions
): Promise<void> {
  const maxWaitTime = 5000; // 5 seconds should be enough for extension to load
  const checkInterval = 500; // Check every 500ms
  const maxAttempts = maxWaitTime / checkInterval;

  log('Waiting for extension to load (checking for chrome-extension:// pages)', options);

  for (let i = 0; i < maxAttempts; i++) {
    const pages = context.pages();
    log(`  Attempt ${i + 1}/${maxAttempts}: Found ${pages.length} pages`, options);

    // Check if any chrome-extension:// page exists
    const hasExtensionPage = pages.some(page => page.url().startsWith('chrome-extension://'));

    if (hasExtensionPage) {
      log('Extension loaded successfully (chrome-extension:// page found)', options);
      // Additional wait for Service Worker to be fully initialized
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  // If no extension page found, continue anyway (might work)
  log('Warning: No chrome-extension:// page found, but continuing', options);
}

/**
 * Get extension ID from context pages
 */
async function getExtensionId(
  context: BrowserContext,
  options: LoadExtensionOptions
): Promise<string> {
  const maxAttempts = 10;
  const retryDelay = 500; // 500ms

  for (let i = 0; i < maxAttempts; i++) {
    const pages = context.pages();
    log(`Checking ${pages.length} pages for extension ID (attempt ${i + 1}/${maxAttempts})`, options);

    for (const page of pages) {
      const url = page.url();
      log(`  Page URL: ${url}`, options);

      if (url.startsWith('chrome-extension://')) {
        const matches = url.match(/chrome-extension:\/\/([a-z]+)\//);
        if (matches && matches[1]) {
          return matches[1];
        }
      }
    }

    // Wait before next attempt
    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Failed to get extension ID: no chrome-extension:// URLs found');
}

/**
 * Open popup page
 */
async function openPopupPage(
  context: BrowserContext,
  extensionId: string,
  options: LoadExtensionOptions
): Promise<Page> {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  log(`Opening popup URL: ${popupUrl}`, options);

  const popupPage = await context.newPage();

  try {
    await popupPage.goto(popupUrl, {
      timeout: options.timeout! / 2,
      waitUntil: 'domcontentloaded',
    });

    // Wait for network to be idle
    await popupPage.waitForLoadState('networkidle', {
      timeout: 5000,
    });

    log('Popup page loaded successfully', options);
    return popupPage;
  } catch (error) {
    throw new Error(`Failed to open popup page: ${error}`);
  }
}

/**
 * Wait for Alpine.js to be initialized on the page
 * Enhanced with better timeout handling and logging
 */
export async function waitForAlpine(page: Page, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();

  try {
    // Step 1: Wait for Alpine global object
    await page.waitForFunction(
      () => {
        return typeof (window as any).Alpine !== 'undefined';
      },
      { timeout: timeout / 3 }
    );
    const step1Time = Date.now() - startTime;
    console.log(`[Alpine] Step 1: Alpine object available (${step1Time}ms)`);

    // Step 2: Wait for Alpine.version (indicates initialization complete)
    await page.waitForFunction(
      () => {
        const alpine = (window as any).Alpine;
        return alpine && alpine.version;
      },
      { timeout: timeout / 3 }
    );
    const step2Time = Date.now() - startTime;
    console.log(`[Alpine] Step 2: Alpine.version available (${step2Time}ms)`);

    // Step 3: Wait for DOM content loaded
    await page.waitForLoadState('domcontentloaded', {
      timeout: timeout / 3,
    });
    const step3Time = Date.now() - startTime;
    console.log(`[Alpine] Step 3: DOM content loaded (${step3Time}ms)`);

    // Step 4: Additional wait for Alpine reactivity to settle
    await page.waitForTimeout(1000);

    const totalTime = Date.now() - startTime;
    console.log(`[Alpine] Initialization completed successfully (total: ${totalTime}ms)`);
  } catch (error) {
    const failedTime = Date.now() - startTime;
    const errorMessage = `Alpine.js initialization failed after ${failedTime}ms: ${error}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Close extension context with error handling
 */
export async function closeExtension(extensionContext: ExtensionContext | undefined): Promise<void> {
  if (!extensionContext) {
    console.warn('[ExtensionLoader] closeExtension called with undefined context');
    return;
  }

  try {
    await extensionContext.context.close();
    console.log('[ExtensionLoader] Extension context closed successfully');
  } catch (error) {
    console.error('[ExtensionLoader] Error closing extension context:', error);
    // Don't throw - cleanup should not fail tests
  }
}

/**
 * Get popup URL for extension
 */
export function getPopupUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/popup.html`;
}

/**
 * Get XPath manager URL for extension
 */
export function getXPathManagerUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/xpath-manager.html`;
}

/**
 * Get automation variables manager URL for extension
 */
export function getAutomationVariablesManagerUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/automation-variables-manager.html`;
}

/**
 * Get system settings URL for extension
 */
export function getSystemSettingsUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/system-settings.html`;
}

/**
 * Get storage sync manager URL for extension
 */
export function getStorageSyncManagerUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/storage-sync-manager.html`;
}
