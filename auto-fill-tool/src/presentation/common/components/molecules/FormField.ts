/**
 * Presentation Layer: Common Molecular Component - FormField
 * Molecule: Label + Input/Select/Textarea with error message support
 */

export interface FormFieldProps {
  id: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'checkbox' | 'toggle' | 'color';
  inputHtml: string; // Pre-rendered input component HTML
  required?: boolean;
  error?: string;
  hint?: string;
  'data-i18n-label'?: string;
  'data-i18n-hint'?: string;
  'data-i18n-error'?: string;
  layout?: 'vertical' | 'horizontal';
}

/**
 * Render form field component
 * @param props Form field properties
 * @returns HTML string for form field
 */
// eslint-disable-next-line complexity -- FormField combines label, input, hint, and error with multiple layout variations (vertical/horizontal, checkbox/toggle special handling). Each conditional handles specific UI patterns (layout, label position, i18n attributes, error/hint display). Splitting would break component composition pattern.
export function renderFormField(props: FormFieldProps): string {
  const isHorizontal = props.layout === 'horizontal';
  const isCheckboxOrToggle = props.type === 'checkbox' || props.type === 'toggle';

  const containerClasses = isHorizontal
    ? 'flex items-center gap-4'
    : isCheckboxOrToggle
      ? 'flex items-center gap-2'
      : 'flex flex-col gap-1';

  const labelClasses = isCheckboxOrToggle
    ? 'text-sm font-medium text-gray-700 cursor-pointer'
    : 'block text-sm font-medium text-gray-700';

  const labelI18nAttr = props['data-i18n-label'] ? `data-i18n="${props['data-i18n-label']}"` : '';
  const hintI18nAttr = props['data-i18n-hint'] ? `data-i18n="${props['data-i18n-hint']}"` : '';
  const errorI18nAttr = props['data-i18n-error'] ? `data-i18n="${props['data-i18n-error']}"` : '';

  const requiredMark = props.required ? '<span class="text-red-600">*</span>' : '';

  const labelHtml = isCheckboxOrToggle
    ? `
    <label for="${props.id}" class="${labelClasses}" ${labelI18nAttr}>
      ${props.inputHtml}
      <span class="ml-2">${props.label} ${requiredMark}</span>
    </label>
  `
    : `
    <label for="${props.id}" class="${labelClasses}" ${labelI18nAttr}>
      ${props.label} ${requiredMark}
    </label>
    ${props.inputHtml}
  `;

  const hintHtml = props.hint
    ? `<p class="text-xs text-gray-500" ${hintI18nAttr}>${props.hint}</p>`
    : '';

  const errorHtml = props.error
    ? `<p class="text-xs text-red-600" ${errorI18nAttr}>${props.error}</p>`
    : '';

  return `
    <div class="${containerClasses}">
      ${labelHtml}
      ${hintHtml}
      ${errorHtml}
    </div>
  `;
}
