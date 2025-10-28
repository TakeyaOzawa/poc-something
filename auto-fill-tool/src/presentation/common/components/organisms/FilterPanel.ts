/**
 * Presentation Layer: Common Organism Component - FilterPanel
 * Organism: Collapsible filter panel with multiple filter controls
 */

export interface FilterPanelProps {
  title?: string;
  titleI18n?: string;
  filters: Array<{
    label: string;
    html: string; // Pre-rendered filter control HTML
    labelI18n?: string;
  }>;
  isCollapsible?: boolean;
  isOpenByDefault?: boolean;
  'x-data-state'?: string;
}

/**
 * Render filter panel component
 * @param props Filter panel properties
 * @returns HTML string for filter panel
 */
export function renderFilterPanel(props: FilterPanelProps): string {
  const title = props.title || 'Filters';
  const titleI18nAttr = props.titleI18n ? `data-i18n="${props.titleI18n}"` : '';
  const isCollapsible = props.isCollapsible ?? true;
  const xDataState = props['x-data-state'] || `{ isOpen: ${props.isOpenByDefault ?? true} }`;

  const filtersHtml = props.filters
    .map((filter) => {
      const labelI18nAttr = filter.labelI18n ? `data-i18n="${filter.labelI18n}"` : '';
      return `
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700" ${labelI18nAttr}>
          ${filter.label}
        </label>
        ${filter.html}
      </div>
    `;
    })
    .join('\n    ');

  if (isCollapsible) {
    return `
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" x-data="${xDataState}">
    <button
      type="button"
      class="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      @click="isOpen = !isOpen">
      <h3 class="text-sm font-semibold text-gray-800" ${titleI18nAttr}>
        ${title}
      </h3>
      <span x-text="isOpen ? '▲' : '▼'" class="text-gray-500"></span>
    </button>
    <div x-show="isOpen" x-transition class="p-4 space-y-4">
      ${filtersHtml}
    </div>
  </div>
  `;
  } else {
    return `
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
    <h3 class="text-sm font-semibold text-gray-800 mb-4" ${titleI18nAttr}>
      ${title}
    </h3>
    <div class="space-y-4">
      ${filtersHtml}
    </div>
  </div>
  `;
  }
}
