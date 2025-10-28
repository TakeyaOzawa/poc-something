/**
 * Presentation Layer: Common Organism Component - TabBar
 * Organism: Tab navigation bar with multiple tabs
 */

export interface TabBarProps {
  tabs: Array<{
    html: string; // Pre-rendered tab item HTML
  }>;
  className?: string;
  variant?: 'underline' | 'pills';
}

/**
 * Render tab bar component
 * @param props Tab bar properties
 * @returns HTML string for tab bar
 */
export function renderTabBar(props: TabBarProps): string {
  const variant = props.variant || 'underline';

  const baseClasses =
    variant === 'underline'
      ? 'flex border-b border-gray-200 bg-white'
      : 'flex gap-2 p-2 bg-gray-100 rounded-lg';

  const customClasses = props.className || '';
  const classes = `${baseClasses} ${customClasses}`.trim();

  const tabsHtml = props.tabs.map((tab) => tab.html).join('\n    ');

  return `
  <div class="${classes}">
    ${tabsHtml}
  </div>
  `;
}
