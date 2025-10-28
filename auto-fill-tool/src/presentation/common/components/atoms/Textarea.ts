/**
 * Presentation Layer: Common Atomic Component - Textarea
 * Atom: Generic textarea for forms
 */

export interface TextareaProps {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  'x-model'?: string;
  'data-i18n'?: string;
  rows?: number;
  cols?: number;
  maxlength?: number;
  fullWidth?: boolean;
}

/**
 * Render textarea component
 * @param props Textarea properties
 * @returns HTML string for textarea
 */
// eslint-disable-next-line complexity -- HTML textarea element supports 12+ optional attributes (id, name, value, placeholder, required, disabled, readonly, x-model, data-i18n, rows, cols, maxlength, fullWidth). Each attribute check is necessary for complete form component functionality. Splitting would break HTML attribute generation pattern.
export function renderTextarea(props: TextareaProps): string {
  const baseClasses =
    'px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical';
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
  const readonlyClasses = props.readonly ? 'bg-gray-50' : '';
  const fullWidthClasses = props.fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${disabledClasses} ${readonlyClasses} ${fullWidthClasses}`;

  const idAttr = props.id ? `id="${props.id}"` : '';
  const nameAttr = props.name ? `name="${props.name}"` : '';
  const placeholderAttr = props.placeholder ? `placeholder="${props.placeholder}"` : '';
  const requiredAttr = props.required ? 'required' : '';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const readonlyAttr = props.readonly ? 'readonly' : '';
  const xModelAttr = props['x-model'] ? `x-model="${props['x-model']}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';
  const rowsAttr = props.rows ? `rows="${props.rows}"` : 'rows="3"';
  const colsAttr = props.cols ? `cols="${props.cols}"` : '';
  const maxlengthAttr = props.maxlength ? `maxlength="${props.maxlength}"` : '';

  const value = props.value || '';

  return `
    <textarea
      ${idAttr}
      ${nameAttr}
      class="${classes}"
      ${placeholderAttr}
      ${requiredAttr}
      ${disabledAttr}
      ${readonlyAttr}
      ${xModelAttr}
      ${i18nAttr}
      ${rowsAttr}
      ${colsAttr}
      ${maxlengthAttr}>${value}</textarea>
  `;
}
