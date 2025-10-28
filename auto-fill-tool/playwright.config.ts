import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Chrome Extension Testing
 *
 * This config enables testing of the Auto Fill Tool Chrome extension
 * by loading the built extension into a Chromium browser context.
 *
 * @version 4.1.0 - Enhanced with extended timeouts, retry logic, and headless mode support
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts', // Only run Playwright tests (*.spec.ts), not Jest E2E tests

  // Timeout for each test (extended for Chrome Extension loading)
  timeout: 90000, // 90 seconds (was 60s)

  // Timeout for expect() assertions
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Test execution settings
  fullyParallel: false, // Run tests sequentially for Chrome extension
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once locally, twice in CI
  workers: 1, // Chrome extension tests should run one at a time

  // Reporter configuration
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL for static pages (if needed)
    baseURL: 'chrome-extension://',

    // Headless mode (default: false for Chrome extensions)
    // Can be overridden with HEADLESS=true environment variable
    headless: process.env.HEADLESS === 'true' ? true : false,

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout (default: no timeout, using test timeout)
    actionTimeout: 15000, // 15 seconds for actions like click, fill
  },

  // Configure projects for Chrome extension testing
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Extension will be loaded via launchOptions in each test
      },
    },
  ],

  // Run build before tests
  webServer: undefined, // We don't need a web server for Chrome extension
});
