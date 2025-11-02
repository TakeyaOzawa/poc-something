/**
 * Screenshot Action Executor
 * Handles SCREENSHOT action execution
 * Takes a screenshot and saves it with a filename pattern: {name}_YYYYMMDDhhmm.png
 *
 * @coverage 0%
 * @reason Chrome tabs.captureVisibleTab API cannot be properly mocked in Jest test environment.
 * Integration tests or E2E tests are more appropriate for testing screenshot functionality.
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '@domain/types/action.types';
import { Logger } from '@domain/types/logger.types';

// Screenshot quality patterns
export const SCREENSHOT_QUALITY = {
  HIGH: 100, // Pattern 100: High quality (100% JPEG quality)
  MEDIUM: 80, // Pattern 80: Medium quality (80% JPEG quality)
  LOW: 60, // Pattern 60: Low quality (60% JPEG quality)
} as const;

export class ScreenshotActionExecutor implements ActionExecutor {
  constructor(private logger: Logger) {}

  /**
   * Generate filename with timestamp
   */
  private generateFilename(baseName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const timestamp = `${year}${month}${day}${hours}${minutes}`;
    return `${baseName}_${timestamp}.png`;
  }

  /**
   * Get quality value from action pattern
   */
  private getQuality(actionPattern: number): number {
    if (actionPattern === SCREENSHOT_QUALITY.LOW) {
      return 60;
    } else if (actionPattern === SCREENSHOT_QUALITY.MEDIUM) {
      return 80;
    } else {
      // Default to high quality
      return 100;
    }
  }

  /**
   * Sleep utility for waiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // eslint-disable-next-line max-params, max-lines-per-function, complexity -- Takes a screenshot using Chrome API, generates timestamped filename, converts to blob, initiates download, and cleans up resources. The sequential browser API calls with error handling are clear and necessary. Additionally handles background tab activation for screenshot capture.
  async execute(
    tabId: number,
    _xpath: string, // Not used for screenshot
    value: string, // Base filename (e.g., "login_screenshot")
    actionPattern: number, // Quality: 100=high, 80=medium, 60=low
    stepNumber: number,
    _actionType?: string
  ): Promise<ActionExecutionResult> {
    let originalTabId: number | undefined;

    try {
      this.logger.info(`[Step ${stepNumber}] Taking screenshot`, {
        tabId,
        baseName: value,
        quality: actionPattern,
      });

      // Validate filename
      if (!value || value.trim().length === 0) {
        return {
          success: false,
          message: 'Screenshot filename cannot be empty',
        };
      }

      // Generate filename with timestamp
      const filename = this.generateFilename(value.trim());
      const quality = this.getQuality(actionPattern);

      this.logger.debug(`[Step ${stepNumber}] Screenshot configuration`, {
        filename,
        quality,
        format: 'png',
      });

      // Get current active tab to restore later
      const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (currentTabs.length > 0) {
        originalTabId = currentTabs[0].id;
        this.logger.debug(`[Step ${stepNumber}] Current active tab: ${originalTabId}`);
      }

      // Activate target tab for screenshot capture
      await browser.tabs.update(tabId, { active: true });
      this.logger.debug(`[Step ${stepNumber}] Activated target tab: ${tabId}`);

      // Wait for rendering to complete (500ms)
      await this.sleep(500);

      // Get tab information to get windowId
      const tab = await browser.tabs.get(tabId);

      // Capture visible tab
      const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
        quality,
      });

      // Restore original active tab
      if (originalTabId && originalTabId !== tabId) {
        try {
          await browser.tabs.update(originalTabId, { active: true });
          this.logger.debug(`[Step ${stepNumber}] Restored original tab: ${originalTabId}`);
        } catch (restoreError) {
          this.logger.warn(
            `[Step ${stepNumber}] Failed to restore original tab: ${originalTabId}. Error: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`
          );
          // Continue anyway, screenshot was successful
        }
      }

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const downloadId = await browser.downloads.download({
        url,
        filename,
        saveAs: false, // Auto-save to default download location
      });

      // Clean up object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.logger.info(`[Step ${stepNumber}] Screenshot saved successfully`, {
        downloadId,
        filename,
        sizeBytes: blob.size,
        sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
      });

      return {
        success: true,
        message: `Screenshot saved as ${filename}`,
      };
    } catch (error) {
      this.logger.error(`[Step ${stepNumber}] Screenshot failed`, error);

      // Try to restore original tab even if screenshot failed
      if (originalTabId && originalTabId !== tabId) {
        try {
          await browser.tabs.update(originalTabId, { active: true });
          this.logger.debug(
            `[Step ${stepNumber}] Restored original tab after error: ${originalTabId}`
          );
        } catch (restoreError) {
          this.logger.warn(
            `[Step ${stepNumber}] Failed to restore original tab after error: ${originalTabId}. Error: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`
          );
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
