/**
 * Domain Constants: Context Menu IDs
 * Defines all Chrome extension context menu identifiers
 */

/**
 * Context Menu ID constants
 */
export const CONTEXT_MENU_IDS = {
  /**
   * Parent menu for getting XPath and saving to a website
   */
  GET_XPATH: 'get-xpath',

  /**
   * Menu for showing XPath without saving
   */
  SHOW_XPATH: 'show-xpath',

  /**
   * Submenu for creating a new website configuration
   */
  GET_XPATH_NEW: 'get-xpath-new',

  /**
   * Prefix for website-specific submenus
   * Full ID format: `get-xpath-${websiteId}`
   */
  GET_XPATH_PREFIX: 'get-xpath-',
} as const;

/**
 * Generate context menu ID for a specific website
 */
export function getWebsiteContextMenuId(websiteId: string): string {
  return `${CONTEXT_MENU_IDS.GET_XPATH_PREFIX}${websiteId}`;
}
