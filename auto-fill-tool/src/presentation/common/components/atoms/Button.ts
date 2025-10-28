/**
 * Presentation Layer: Common Atomic Component - Button
 * Atom: Generic button for all screens
 */

export interface ButtonProps {
  label: string;
  onClick?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  id?: string;
  'data-i18n'?: string;
}

/**
 * Render button component
 * @param props Button properties
 * @returns HTML string for button
 */
// eslint-disable-next-line complexity -- Multiple optional attributes (size, variant, disabled, fullWidth, icon, iconPosition, id, onClick, data-i18n) require conditional HTML attribute generation. Each attribute check is necessary for flexible component API. Splitting would reduce reusability.
export function renderButton(props: ButtonProps): string {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    info: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const size = props.size || 'md';
  const variant = props.variant || 'primary';
  const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
  const fullWidthClasses = props.fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${fullWidthClasses}`;

  const type = props.type || 'button';
  const idAttr = props.id ? `id="${props.id}"` : '';
  const onClickAttr = props.onClick ? `@click="${props.onClick}"` : '';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';

  const iconLeft = props.icon && props.iconPosition !== 'right' ? `<span>${props.icon}</span>` : '';
  const iconRight =
    props.icon && props.iconPosition === 'right' ? `<span>${props.icon}</span>` : '';

  return `
    <button
      ${idAttr}
      type="${type}"
      class="${classes}"
      ${onClickAttr}
      ${disabledAttr}
      ${i18nAttr}>
      ${iconLeft}
      <span>${props.label}</span>
      ${iconRight}
    </button>
  `;
}
