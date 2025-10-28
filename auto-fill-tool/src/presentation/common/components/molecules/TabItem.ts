/**
 * Presentation Layer: Common Molecular Component - TabItem
 * Molecule: Individual tab item for tab navigation
 */

export interface TabItemProps {
  id: string;
  label: string;
  active?: boolean;
  onClick?: string;
  'data-i18n'?: string;
  icon?: string;
}

/**
 * Render tab item component
 * @param props Tab item properties
 * @returns HTML string for tab item
 */
export function renderTabItem(props: TabItemProps): string {
  const baseClasses =
    'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2';
  const activeClasses = props.active
    ? 'border-blue-600 text-blue-600'
    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300';

  const classes = `${baseClasses} ${activeClasses}`;

  const onClickAttr = props.onClick ? `@click="${props.onClick}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';

  const iconHtml = props.icon ? `<span>${props.icon}</span>` : '';

  return `
  <button
    type="button"
    id="${props.id}"
    class="${classes}"
    ${onClickAttr}
    ${i18nAttr}>
    ${iconHtml}
    <span>${props.label}</span>
  </button>
  `;
}
