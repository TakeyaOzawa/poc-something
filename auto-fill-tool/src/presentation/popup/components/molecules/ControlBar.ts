/**
 * Presentation Layer: Popup UI Atomic Component - ControlBar
 * Molecule: Top control button bar
 */

import { renderIconButton, IconButtonProps } from '../atoms/IconButton';

export interface ControlBarProps {
  onAddWebsite: string;
  onXPathManager: string;
  onAutomationVariables: string;
  onDataSync: string;
  onSettings: string;
}

/**
 * Render control bar component
 * @param props Control bar properties
 * @returns HTML string for control bar
 */
export function renderControlBar(props: ControlBarProps): string {
  const buttons: IconButtonProps[] = [
    { icon: '➕', label: 'サイト追加', onClick: props.onAddWebsite, variant: 'primary' },
    { icon: '🔍', label: 'XPath', onClick: props.onXPathManager, variant: 'info' },
    { icon: '📋', label: '実行履歴', onClick: props.onAutomationVariables, variant: 'info' },
    { icon: '🔄', label: '同期', onClick: props.onDataSync, variant: 'info' },
    { icon: '⚙️', label: '設定', onClick: props.onSettings, variant: 'info' },
  ];

  const buttonsHtml = buttons.map((btn) => renderIconButton(btn)).join('');

  return `
    <div class="grid grid-cols-5 gap-1 mb-3 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
      ${buttonsHtml}
    </div>
  `;
}
