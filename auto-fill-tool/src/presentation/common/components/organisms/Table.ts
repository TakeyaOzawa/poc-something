/**
 * Presentation Layer: Common Organism Component - Table
 * Organism: Complete data table with header, rows, and empty state
 */

export interface TableProps {
  headerHtml: string; // Pre-rendered table header HTML
  rowsHtml: string; // Pre-rendered table rows HTML
  emptyStateHtml?: string; // Pre-rendered empty state HTML
  className?: string;
  striped?: boolean;
}

/**
 * Render table component
 * @param props Table properties
 * @returns HTML string for table
 */
export function renderTable(props: TableProps): string {
  const baseClasses = 'min-w-full divide-y divide-gray-200 bg-white';
  const customClasses = props.className || '';
  const classes = `${baseClasses} ${customClasses}`.trim();

  const tbodyClasses = props.striped
    ? 'divide-y divide-gray-200 bg-white'
    : 'divide-y divide-gray-200';

  // Check if rows are empty
  const isEmpty = !props.rowsHtml || props.rowsHtml.trim() === '';

  const tableContent = isEmpty
    ? `
    <tbody>
      <tr>
        <td colspan="100" class="px-6 py-12 text-center">
          ${props.emptyStateHtml || '<p class="text-gray-500">No data available</p>'}
        </td>
      </tr>
    </tbody>
  `
    : `
    <tbody class="${tbodyClasses}">
      ${props.rowsHtml}
    </tbody>
  `;

  return `
  <div class="overflow-x-auto shadow-md rounded-lg">
    <table class="${classes}">
      ${props.headerHtml}
      ${tableContent}
    </table>
  </div>
  `;
}
