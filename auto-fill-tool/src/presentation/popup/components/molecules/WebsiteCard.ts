/**
 * Presentation Layer: Popup UI Atomic Component - WebsiteCard
 * Molecule: Individual website information card
 */

import { renderStatusBadge } from '../atoms/StatusBadge';
import { renderActionButton } from '../atoms/ActionButton';

export interface WebsiteCardProps {
  id: string;
  name: string;
  status: 'enabled' | 'disabled' | 'once';
  statusText: string;
  variables: string;
  onExecute: string;
  onEdit: string;
  onDelete: string;
}

/**
 * Render website card component
 * @param props Website card properties
 * @returns HTML string for website card
 */
export function renderWebsiteCard(props: WebsiteCardProps): string {
  const statusBadge = renderStatusBadge({ status: props.status, text: props.statusText });

  const executeButton = renderActionButton({
    icon: '▶️',
    action: 'execute',
    id: props.id,
    onClick: props.onExecute,
    title: '実行',
  });

  const editButton = renderActionButton({
    icon: '✏️',
    action: 'edit',
    id: props.id,
    onClick: props.onEdit,
    title: '編集',
  });

  const deleteButton = renderActionButton({
    icon: '🗑️',
    action: 'delete',
    id: props.id,
    onClick: props.onDelete,
    title: '削除',
  });

  return `
    <div
      class="website-item bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-2 hover:shadow-md transition-shadow"
      data-id="${props.id}">
      <!-- ヘッダー -->
      <div class="flex items-start justify-between mb-1.5">
        <div class="font-semibold text-gray-900 text-sm flex-1 mr-2 leading-tight">${props.name}</div>
        <div class="flex gap-0.5 flex-shrink-0">
          ${executeButton}
          ${editButton}
          ${deleteButton}
        </div>
      </div>

      <!-- ステータス -->
      <div class="mb-1.5">
        ${statusBadge}
      </div>

      <!-- 変数 -->
      <div class="text-xs text-gray-600 font-mono bg-gray-50 px-1.5 py-1 rounded border border-gray-200 overflow-x-auto whitespace-nowrap">
        ${props.variables}
      </div>
    </div>
  `;
}
