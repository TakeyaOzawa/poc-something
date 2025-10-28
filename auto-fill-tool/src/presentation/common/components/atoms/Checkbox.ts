/**
 * Presentation Layer: Common Atomic Component - Checkbox
 * Atom: Generic checkbox for forms
 */

export interface CheckboxProps {
  id?: string;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  'x-model'?: string;
  'data-i18n'?: string;
  value?: string;
}

/**
 * Render checkbox component
 * @param props Checkbox properties
 * @returns HTML string for checkbox
 */
export function renderCheckbox(props: CheckboxProps): string {
  const baseClasses =
    'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors';
  const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const classes = `${baseClasses} ${disabledClasses}`;

  const idAttr = props.id ? `id="${props.id}"` : '';
  const nameAttr = props.name ? `name="${props.name}"` : '';
  const checkedAttr = props.checked ? 'checked' : '';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const xModelAttr = props['x-model'] ? `x-model="${props['x-model']}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';
  const valueAttr = props.value ? `value="${props.value}"` : '';

  return `
    <input
      ${idAttr}
      ${nameAttr}
      type="checkbox"
      class="${classes}"
      ${checkedAttr}
      ${disabledAttr}
      ${xModelAttr}
      ${i18nAttr}
      ${valueAttr}
    />
  `;
}
