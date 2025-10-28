/**
 * Presentation Layer: Common Molecular Component - ActionBar
 * Molecule: Action buttons bar for page-level actions
 */

export interface ActionBarProps {
  title?: string;
  titleI18n?: string;
  actions: Array<{
    html: string; // Pre-rendered button HTML
  }>;
  align?: 'left' | 'right' | 'between' | 'center';
}

/**
 * Render action bar component
 * @param props Action bar properties
 * @returns HTML string for action bar
 */
export function renderActionBar(props: ActionBarProps): string {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
    center: 'justify-center',
  };

  const align = props.align || 'between';
  const baseClasses = `flex items-center gap-3 mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm ${alignClasses[align]}`;

  const titleHtml = props.title
    ? `
    <h2 class="text-lg font-semibold text-gray-800" ${props.titleI18n ? `data-i18n="${props.titleI18n}"` : ''}>
      ${props.title}
    </h2>
  `
    : '';

  const actionsHtml = props.actions.map((action) => action.html).join('\n    ');

  return `
  <div class="${baseClasses}">
    ${titleHtml}
    <div class="flex items-center gap-2">
      ${actionsHtml}
    </div>
  </div>
  `;
}
