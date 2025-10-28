/**
 * Presentation Layer: Popup UI Atomic Component - PopupLayout
 * Template: Complete popup layout combining all organisms
 */

import { renderControlBar } from '../molecules/ControlBar';
import { renderWebsiteList } from '../organisms/WebsiteList';
import { renderEditModal } from '../organisms/EditModal';

/**
 * Render popup layout template
 * This is the top-level layout that combines all components
 * @returns HTML string for complete popup layout
 */
export function renderPopupLayout(): string {
  const controlBar = renderControlBar({
    onAddWebsite: 'openAddModal()',
    onXPathManager: 'openXPathManager()',
    onAutomationVariables: 'openAutomationVariablesManager()',
    onDataSync: 'openDataSyncSettings()',
    onSettings: 'openSettings()',
  });

  const websiteList = renderWebsiteList();
  const editModal = renderEditModal();

  return `
    <div class="w-[400px] min-h-[300px] p-3 bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- ヘッダー -->
      <h1 class="text-base font-semibold text-center text-gray-900 mb-3">
        📝 自動入力ツール
      </h1>

      <!-- コントロールバー -->
      ${controlBar}

      <!-- ウェブサイトリスト -->
      ${websiteList}

      <!-- 編集モーダル -->
      ${editModal}
    </div>
  `;
}
