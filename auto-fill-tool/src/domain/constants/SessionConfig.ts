/**
 * Domain Constants: Session Configuration
 * Business rules for secure storage session management
 */

/**
 * Session Configuration
 * Business Rule: Session timeout for secure storage
 *
 * Security consideration: 15 minutes provides a balance between
 * user convenience and security. Short enough to limit exposure
 * if user leaves their device unattended, long enough to avoid
 * frequent re-authentication during active use.
 */
export const SESSION_CONFIG = Object.freeze({
  /**
   * Session duration in minutes
   * Business Rule: 15 minutes for security/convenience balance
   */
  DURATION_MINUTES: 15,

  /**
   * Session duration in milliseconds
   * Business Rule: 15 * 60 * 1000 = 900,000ms
   */
  DURATION_MS: 15 * 60 * 1000,
} as const);

/**
 * Type for session configuration
 */
export type SessionConfig = typeof SESSION_CONFIG;

/**
 * Helper function to convert minutes to milliseconds
 * @param minutes Duration in minutes
 * @returns Duration in milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Helper function to convert milliseconds to minutes
 * @param ms Duration in milliseconds
 * @returns Duration in minutes
 */
export function msToMinutes(ms: number): number {
  return ms / (60 * 1000);
}
