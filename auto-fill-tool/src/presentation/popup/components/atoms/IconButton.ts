/**
 * Presentation Layer: Popup UI Atomic Component - IconButton
 * Atom: Icon button with label for compact UI
 */

export interface IconButtonProps {
  icon: string;
  label: string;
  onClick: string;
  variant?: 'primary' | 'info' | 'success' | 'danger';
  disabled?: boolean;
}

/**
 * Render icon button component
 * @param props Icon button properties
 * @returns HTML string for icon button
 */
export function renderIconButton(props: IconButtonProps): string {
  const baseClasses =
    'flex flex-col items-center justify-center gap-0.5 min-h-[40px] px-1.5 py-1.5 rounded transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    info: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
  const variant = props.variant || 'info';
  const classes = `${baseClasses} ${variantClasses[variant]} ${disabledClasses}`;

  return `
    <button
      class="${classes}"
      @click="${props.onClick}"
      ${props.disabled ? 'disabled' : ''}>
      <span class="text-base leading-none">${props.icon}</span>
      <span class="text-[10px] font-semibold leading-tight">${props.label}</span>
    </button>
  `;
}
