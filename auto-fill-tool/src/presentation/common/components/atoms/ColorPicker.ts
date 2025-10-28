/**
 * Presentation Layer: Common Atomic Component - ColorPicker
 * Atom: Color picker input for theme customization
 */

export interface ColorPickerProps {
  id?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  'x-model'?: string;
  'data-i18n'?: string;
}

/**
 * Render color picker component
 * @param props Color picker properties
 * @returns HTML string for color picker
 */
export function renderColorPicker(props: ColorPickerProps): string {
  const baseClasses =
    'h-10 w-20 border border-gray-300 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : '';

  const classes = `${baseClasses} ${disabledClasses}`;

  const idAttr = props.id ? `id="${props.id}"` : '';
  const nameAttr = props.name ? `name="${props.name}"` : '';
  const valueAttr = props.value ? `value="${props.value}"` : 'value="#000000"';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const xModelAttr = props['x-model'] ? `x-model="${props['x-model']}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';

  return `
    <input
      ${idAttr}
      ${nameAttr}
      type="color"
      class="${classes}"
      ${valueAttr}
      ${disabledAttr}
      ${xModelAttr}
      ${i18nAttr}
    />
  `;
}
