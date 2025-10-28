/**
 * Presentation Layer: Popup UI Atomic Component - StatusBadge
 * Atom: Status badge for website state display
 */

export interface StatusBadgeProps {
  status: 'enabled' | 'disabled' | 'once';
  text: string;
}

/**
 * Render status badge component
 * @param props Status badge properties
 * @returns HTML string for status badge
 */
export function renderStatusBadge(props: StatusBadgeProps): string {
  const statusClasses = {
    enabled: 'bg-green-100 text-green-800',
    disabled: 'bg-gray-200 text-gray-700',
    once: 'bg-blue-100 text-blue-800',
  };

  const classes = `inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${statusClasses[props.status]}`;

  return `
    <span class="${classes}">
      ${props.text}
    </span>
  `;
}
