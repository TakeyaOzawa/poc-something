/**
 * Domain Entity: Auto-Fill Event
 * Represents a DOM event to be dispatched during auto-fill
 */

export interface AutoFillEvent {
  id: number;
  name: string;
  eventType: string; // eg, 'click', 'focus', 'blur', 'change', 'input'
  description?: string | undefined;
}

export const DEFAULT_EVENTS: AutoFillEvent[] = [
  { id: 1, name: 'Click', eventType: 'click', description: 'マウスクリックイベント' },
  { id: 2, name: 'Focus', eventType: 'focus', description: 'フォーカスイベント' },
  { id: 3, name: 'Blur', eventType: 'blur', description: 'フォーカス喪失イベント' },
  { id: 4, name: 'Change', eventType: 'change', description: '変更イベント' },
  { id: 5, name: 'Input', eventType: 'input', description: '入力イベント' },
  { id: 6, name: 'Mouse Over', eventType: 'mouseover', description: 'マウスオーバーイベント' },
  { id: 7, name: 'Mouse Out', eventType: 'mouseout', description: 'マウスアウトイベント' },
  { id: 8, name: 'Key Down', eventType: 'keydown', description: 'キー押下イベント' },
  { id: 9, name: 'Key Up', eventType: 'keyup', description: 'キー解放イベント' },
];
