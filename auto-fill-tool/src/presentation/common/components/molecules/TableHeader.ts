/**
 * Presentation Layer: Common Molecular Component - TableHeader
 * Molecule: Table header with sortable columns
 */

export interface TableHeaderColumnProps {
  label: string;
  sortKey?: string;
  className?: string;
  'data-i18n'?: string;
}

export interface TableHeaderProps {
  columns: TableHeaderColumnProps[];
  currentSort?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: string;
}

/**
 * Render table header component
 * @param props Table header properties
 * @returns HTML string for table header
 */
export function renderTableHeader(props: TableHeaderProps): string {
  const columnsHtml = props.columns
    .map((column) => {
      const baseClasses =
        'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50';
      const sortableClasses = column.sortKey ? 'cursor-pointer hover:bg-gray-100' : '';
      const customClasses = column.className || '';

      const classes = `${baseClasses} ${sortableClasses} ${customClasses}`.trim();

      const i18nAttr = column['data-i18n'] ? `data-i18n="${column['data-i18n']}"` : '';

      const onClickAttr =
        column.sortKey && props.onSort ? `@click="${props.onSort}('${column.sortKey}')"` : '';

      // Sort indicator
      const isSorted = column.sortKey && props.currentSort === column.sortKey;
      const sortIndicator = isSorted
        ? props.sortDirection === 'asc'
          ? ' ▲'
          : ' ▼'
        : column.sortKey
          ? ' ⇅'
          : '';

      return `<th class="${classes}" ${onClickAttr} ${i18nAttr}>
        ${column.label}${sortIndicator}
      </th>`;
    })
    .join('\n    ');

  return `
  <thead>
    <tr>
      ${columnsHtml}
    </tr>
  </thead>
  `;
}
