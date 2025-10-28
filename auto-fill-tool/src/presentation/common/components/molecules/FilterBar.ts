/**
 * Presentation Layer: Common Molecular Component - FilterBar
 * Molecule: Filter controls with search and dropdowns
 */

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: string;
  'x-model-search'?: string;
  filters?: Array<{
    type: 'select' | 'button';
    html: string;
  }>;
  'data-i18n-placeholder'?: string;
}

/**
 * Render filter bar component
 * @param props Filter bar properties
 * @returns HTML string for filter bar
 */
export function renderFilterBar(props: FilterBarProps): string {
  const searchPlaceholder = props.searchPlaceholder || 'Search...';
  const searchValue = props.searchValue || '';
  const xModelSearchAttr = props['x-model-search'] ? `x-model="${props['x-model-search']}"` : '';
  const onSearchAttr = props.onSearch ? `@input="${props.onSearch}"` : '';
  const placeholderI18nAttr = props['data-i18n-placeholder']
    ? `data-i18n="${props['data-i18n-placeholder']}"data-i18n-attr="placeholder"`
    : '';

  const searchHtml = `
    <div class="flex-1 min-w-0">
      <input
        type="search"
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="${searchPlaceholder}"
        value="${searchValue}"
        ${xModelSearchAttr}
        ${onSearchAttr}
        ${placeholderI18nAttr}
      />
    </div>
  `;

  const filtersHtml = props.filters
    ? props.filters.map((filter) => `<div>${filter.html}</div>`).join('\n      ')
    : '';

  return `
  <div class="flex items-center gap-3 mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
    ${searchHtml}
    ${filtersHtml}
  </div>
  `;
}
