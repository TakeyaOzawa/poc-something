/**
 * Presentation Layer: Common Atomic Component - Icon
 * Atom: Generic icon component
 */

export interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

/**
 * Render icon component
 * @param props Icon properties
 * @returns HTML string for icon
 */
export function renderIcon(props: IconProps): string {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const size = props.size || 'md';
  const colorClass = props.color || '';
  const customClass = props.className || '';

  const classes = `inline-block ${sizeClasses[size]} ${colorClass} ${customClass}`.trim();

  return `
    <span class="${classes}" aria-hidden="true">
      ${props.name}
    </span>
  `;
}
