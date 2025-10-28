/**
 * Presentation Layer: Common Atomic Component - Input
 * Atom: Generic input field for forms
 */

export interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'number' | 'tel' | 'search';
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  'x-model'?: string;
  'data-i18n'?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Render input component
 * @param props Input properties
 * @returns HTML string for input
 */
// eslint-disable-next-line complexity -- HTML input element supports 15+ optional attributes (type, id, name, value, placeholder, required, disabled, readonly, x-model, data-i18n, size, fullWidth, min, max, step). Each attribute check is necessary for comprehensive form component support. Splitting would break HTML attribute generation pattern.
export function renderInput(props: InputProps): string {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const baseClasses =
    'border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  const size = props.size || 'md';
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
  const readonlyClasses = props.readonly ? 'bg-gray-50' : '';
  const fullWidthClasses = props.fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${sizeClasses[size]} ${disabledClasses} ${readonlyClasses} ${fullWidthClasses}`;

  const type = props.type || 'text';
  const idAttr = props.id ? `id="${props.id}"` : '';
  const nameAttr = props.name ? `name="${props.name}"` : '';
  const valueAttr = props.value ? `value="${props.value}"` : '';
  const placeholderAttr = props.placeholder ? `placeholder="${props.placeholder}"` : '';
  const requiredAttr = props.required ? 'required' : '';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const readonlyAttr = props.readonly ? 'readonly' : '';
  const xModelAttr = props['x-model'] ? `x-model="${props['x-model']}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';
  const minAttr = props.min !== undefined ? `min="${props.min}"` : '';
  const maxAttr = props.max !== undefined ? `max="${props.max}"` : '';
  const stepAttr = props.step !== undefined ? `step="${props.step}"` : '';

  return `
    <input
      ${idAttr}
      ${nameAttr}
      type="${type}"
      class="${classes}"
      ${valueAttr}
      ${placeholderAttr}
      ${requiredAttr}
      ${disabledAttr}
      ${readonlyAttr}
      ${xModelAttr}
      ${i18nAttr}
      ${minAttr}
      ${maxAttr}
      ${stepAttr}
    />
  `;
}
