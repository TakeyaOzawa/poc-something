/**
 * Content Script View Implementation
 * Pure DOM operations - wraps AutoFillOverlay component
 */

import { AutoFillOverlay } from './AutoFillOverlay';
import type { ContentScriptView } from '../types/content-script.types';

/**
 * AutoFillToolContentScriptView - View layer for content script MVP
 *
 * Responsibilities:
 * - Wrap existing AutoFillOverlay component
 * - Provide interface for overlay operations
 * - Dispatch custom events for progress updates
 * - No business logic
 */
export class AutoFillToolContentScriptView implements ContentScriptView {
  private readonly overlay: AutoFillOverlay;

  constructor(overlay: AutoFillOverlay) {
    this.overlay = overlay;
  }

  /**
   * Show the auto-fill overlay
   * @param showCancelButton - Whether to show cancel button
   */
  public async showOverlay(showCancelButton: boolean): Promise<void> {
    await this.overlay.show(undefined, showCancelButton);
  }

  /**
   * Hide the auto-fill overlay
   */
  public hideOverlay(): void {
    this.overlay.hide();
  }

  /**
   * Update progress in the overlay
   * @param current - Current step number
   * @param total - Total number of steps
   */
  public updateProgress(current: number, total: number): void {
    this.overlay.updateProgress(current, total);
  }

  /**
   * Update step description in the overlay
   * @param description - Description of current step
   */
  public updateStepDescription(description: string): void {
    this.overlay.updateStepDescription(description);
  }

  /**
   * Dispatch custom event for progress update
   * @param current - Current step number
   * @param total - Total number of steps
   * @param description - Optional description
   */
  public dispatchProgressEvent(current: number, total: number, description?: string): void {
    const event = new CustomEvent('auto-fill-progress-update', {
      detail: {
        current,
        total,
        description,
      },
    });
    document.dispatchEvent(event);
  }
}
