/**
 * Presentation Layer: Popup UI Atomic Component - EmptyState
 * Molecule: Empty state display when no websites registered
 */

/**
 * Render empty state component
 * @returns HTML string for empty state
 */
export function renderEmptyState(): string {
  return `
    <div class="empty-state text-center py-8 px-4 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <div class="text-3xl mb-2">📝</div>
      <div class="text-xs">Webサイトが登録されていません</div>
      <div class="text-[10px] text-gray-400 mt-1">「サイト追加」ボタンから登録してください</div>
    </div>
  `;
}
