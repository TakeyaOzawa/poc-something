/**
 * Presentation Layer: Popup UI Atomic Component - ActionButton
 * Atom: Small icon button for website actions
 */

export interface ActionButtonProps {
  icon: string;
  action: 'execute' | 'edit' | 'delete';
  id: string;
  onClick: string;
  title?: string;
}

/**
 * Render action button component
 * @param props Action button properties
 * @returns HTML string for action button
 */
export function renderActionButton(props: ActionButtonProps): string {
  const actionClasses = {
    execute: 'bg-green-600 text-white hover:bg-green-700',
    edit: 'bg-yellow-500 text-white hover:bg-yellow-600',
    delete: 'bg-red-600 text-white hover:bg-red-700',
  };

  const baseClasses = 'px-1.5 py-0.5 text-xs rounded transition-colors';
  const classes = `${baseClasses} ${actionClasses[props.action]}`;
  const title = props.title || props.action;

  return `
    <button
      class="${classes}"
      @click="${props.onClick}('${props.id}')"
      title="${title}">
      ${props.icon}
    </button>
  `;
}
