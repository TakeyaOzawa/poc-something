/**
 * Presentation Layer: Common Organism Component - Navigation
 * Organism: Main navigation bar with title and actions
 */

export interface NavigationProps {
  title: string;
  titleI18n?: string;
  backButton?: {
    label: string;
    onClick: string;
    icon?: string;
  };
  actions?: Array<{
    html: string; // Pre-rendered button HTML
  }>;
  className?: string;
}

/**
 * Render navigation component
 * @param props Navigation properties
 * @returns HTML string for navigation
 */
export function renderNavigation(props: NavigationProps): string {
  const baseClasses =
    'sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between';
  const customClasses = props.className || '';
  const classes = `${baseClasses} ${customClasses}`.trim();

  const titleI18nAttr = props.titleI18n ? `data-i18n="${props.titleI18n}"` : '';

  const backButtonHtml = props.backButton
    ? `
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      @click="${props.backButton.onClick}">
      ${props.backButton.icon ? `<span>${props.backButton.icon}</span>` : ''}
      <span>${props.backButton.label}</span>
    </button>
  `
    : '';

  const actionsHtml = props.actions
    ? `
    <div class="flex items-center gap-2">
      ${props.actions.map((action) => action.html).join('\n      ')}
    </div>
  `
    : '';

  return `
  <nav class="${classes}">
    <div class="flex items-center gap-4">
      ${backButtonHtml}
      <h1 class="text-xl font-bold text-gray-800" ${titleI18nAttr}>
        ${props.title}
      </h1>
    </div>
    ${actionsHtml}
  </nav>
  `;
}
