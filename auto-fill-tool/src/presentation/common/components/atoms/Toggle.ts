/**
 * Presentation Layer: Common Atomic Component - Toggle
 * Atom: Toggle switch for boolean settings
 */

export interface ToggleProps {
  id?: string;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  'x-model'?: string;
  'data-i18n'?: string;
}

/**
 * Render toggle switch component
 * @param props Toggle properties
 * @returns HTML string for toggle switch
 */
export function renderToggle(props: ToggleProps): string {
  const idAttr = props.id ? `id="${props.id}"` : '';
  const nameAttr = props.name ? `name="${props.name}"` : '';
  const checkedAttr = props.checked ? 'checked' : '';
  const disabledAttr = props.disabled ? 'disabled' : '';
  const xModelAttr = props['x-model'] ? `x-model="${props['x-model']}"` : '';
  const i18nAttr = props['data-i18n'] ? `data-i18n="${props['data-i18n']}"` : '';

  const containerClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return `
    <label class="inline-flex items-center ${containerClasses}">
      <input
        ${idAttr}
        ${nameAttr}
        type="checkbox"
        class="sr-only peer"
        ${checkedAttr}
        ${disabledAttr}
        ${xModelAttr}
        ${i18nAttr}
      />
      <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  `;
}
