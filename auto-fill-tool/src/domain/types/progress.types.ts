/**
 * Progress Information
 * Represents the current progress state of an automation execution
 */

export interface ProgressInfo {
  /**
   * Current step number (1-based)
   */
  current: number;

  /**
   * Total number of steps
   */
  total: number;

  /**
   * Progress percentage (0-100)
   */
  percentage: number;

  /**
   * Human-readable description of current progress
   * @example "Processing step 5 of 10"
   * @example "Executing CLICK action (Step 3/10)"
   */
  description: string;
}
