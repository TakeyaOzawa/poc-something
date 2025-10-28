/**
 * Presentation Layer: Common Atomic Component - Badge
 * Atom: Generic badge for status indicators
 */

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  'data-i18n'?: string;
}

/**
 * Render badge component
 * @param props Badge properties
 * @returns HTML string for badge
 */
export function renderBadge(props: BadgeProps): string {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-gray-100 text-gray-700',
  };

  const baseClasses = 'inline-flex items-center rounded-full font-semibold';
  const size = props.size || 'md';
  const variant = props.variant || 'default';

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;

  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';

  return `
    <span class="${classes}" ${i18nAttr}>
      ${props.label}
    </span>
  `;
}
