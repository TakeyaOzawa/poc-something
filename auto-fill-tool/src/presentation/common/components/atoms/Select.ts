/**
 * Presentation Layer: Common Atomic Component - Select
 * Atom: Generic select dropdown for forms
 */

export interface SelectOption {
  value: string;
  label: string;
  'data-i18n'?: string;
  selected?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  'x-model'?: string;
  'data-i18n'?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Render select component
 * @param props Select properties
 * @returns HTML string for select
 */
export function renderSelect(props: SelectProps): string {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const baseClasses =
    'border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white';
  const size = props.size || 'md';
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const fullWidthClasses = props.fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${sizeClasses[size]} ${disabledClasses} ${fullWidthClasses}`;

  const idAttr = props.id ? `id="${props.id}"` : '';
  const nameAttr = props.name ? `name="${props.name}"` : '';
  const requiredAttr = props.required ? 'required' : '';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const xModelAttr = props['x-model'] ? `x-model="${props['x-model']}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';

  const optionsHtml = props.options
    .map((option) => {
      const selectedAttr = option.selected ? 'selected' : '';
      const optionI18nAttr = option['data-i18n'] ? `data-i18n="${option['data-i18n']}"` : '';
      return `<option value="${option.value}" ${selectedAttr} ${optionI18nAttr}>${option.label}</option>`;
    })
    .join('\n      ');

  return `
    <select
      ${idAttr}
      ${nameAttr}
      class="${classes}"
      ${requiredAttr}
      ${disabledAttr}
      ${xModelAttr}
      ${i18nAttr}>
      ${optionsHtml}
    </select>
  `;
}
