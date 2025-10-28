/**
 * Presentation Layer: Popup UI Atomic Component - EditModal
 * Organism: Website edit/add modal with form
 */

/**
 * Render edit modal organism
 * This component integrates with Alpine.js for modal state management
 * @returns HTML string for edit modal
 */
// eslint-disable-next-line max-lines-per-function -- HTML template rendering function with integrated Alpine.js directives (@click, x-show, x-transition). The template includes modal overlay, dialog container, header with close button, form with multiple input fields, and action buttons. Splitting the template would break the component structure and Alpine.js data binding.
export function renderEditModal(): string {
  return `
    <div
      class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3"
      x-show="showModal"
      style="display: none;"
      @click.self="closeModal()">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" @click.stop>
        <!-- ヘッダー -->
        <div class="modal-header bg-blue-600 text-white px-4 py-2.5 rounded-t-lg font-semibold text-sm">
          Webサイト設定
        </div>

        <!-- フォーム -->
        <form id="editForm" class="p-4">
          <input type="hidden" id="editId">

          <!-- 名前 -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">名前</label>
            <input
              type="text"
              id="editName"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: マイサイト"
              required>
          </div>

          <!-- ステータス -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">ステータス</label>
            <select
              id="editStatus"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required>
              <option value="disabled">無効</option>
              <option value="enabled">有効</option>
              <option value="once">1度だけ有効</option>
            </select>
          </div>

          <!-- 編集可否 -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">編集可否</label>
            <select
              id="editEditable"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required>
              <option value="true">編集可能</option>
              <option value="false">編集不可</option>
            </select>
          </div>

          <!-- 開始URL -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">開始URL (オプション)</label>
            <input
              type="text"
              id="editStartUrl"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: https://example.com">
          </div>

          <!-- 変数 -->
          <div class="mb-4">
            <label class="block text-xs font-semibold text-gray-700 mb-1">変数</label>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-2">
              <div class="text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">変数一覧</div>
              <div id="variablesList" class="space-y-1.5 mb-2"></div>
              <button
                type="button"
                class="w-full py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                id="addVariableBtn">➕ 変数を追加</button>
            </div>
          </div>

          <!-- アクション -->
          <div class="flex gap-2">
            <button type="submit" class="flex-1 py-2 text-xs font-semibold bg-green-600 text-white hover:bg-green-700 rounded transition-colors">
              💾 保存
            </button>
            <button type="button" class="flex-1 py-2 text-xs font-semibold bg-gray-300 text-gray-700 hover:bg-gray-400 rounded transition-colors" id="cancelBtn">
              ✖ キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
