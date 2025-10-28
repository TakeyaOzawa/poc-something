/**
 * Presentation Layer: Common Molecular Component - TableRow
 * Molecule: Table row with cells
 */

export interface TableCellProps {
  content: string;
  className?: string;
  colspan?: number;
  'data-i18n'?: string;
}

export interface TableRowProps {
  cells: TableCellProps[];
  className?: string;
  onClick?: string;
  hoverable?: boolean;
}

/**
 * Render table row component
 * @param props Table row properties
 * @returns HTML string for table row
 */
export function renderTableRow(props: TableRowProps): string {
  const baseClasses = 'border-b border-gray-200';
  const hoverClasses = props.hoverable ? 'hover:bg-gray-50 cursor-pointer' : '';
  const customClasses = props.className || '';

  const classes = `${baseClasses} ${hoverClasses} ${customClasses}`.trim();

  const onClickAttr = props.onClick ? `@click="${props.onClick}"` : '';

  const cellsHtml = props.cells
    .map((cell) => {
      const cellClasses = cell.className || 'px-4 py-3 text-sm text-gray-700';
      const colspanAttr = cell.colspan ? `colspan="${cell.colspan}"` : '';
      const i18nAttr = cell['data-i18n'] ? `data-i18n="${cell['data-i18n']}"` : '';

      return `<td class="${cellClasses}" ${colspanAttr} ${i18nAttr}>${cell.content}</td>`;
    })
    .join('\n    ');

  return `
  <tr class="${classes}" ${onClickAttr}>
    ${cellsHtml}
  </tr>
  `;
}
