# 全画面 Atomic Design 適用計画書

## 概要

Popup UIで成功したAtomic Designパターンを、全ての管理画面に適用します。

## 対象画面と優先度

### 高優先度（よく使用される画面）

#### 1. XPath Manager (`xpath-manager.html`)
**現状:**
- 複雑なフォームとリスト表示
- モーダル編集機能
- Webサイトフィルター機能

**適用コンポーネント:**
- **Atoms:** Button, Input, Select, Textarea, Badge
- **Molecules:** FormField, XPathCard, FilterBar
- **Organisms:** XPathList, EditModal, Navigation
- **Templates:** XPathManagerLayout

**推定工数:** 4-6時間

#### 2. Automation Variables Manager (`automation-variables-manager.html`)
**現状:**
- テーブル表示
- フィルター・ソート機能
- エクスポート/インポート機能

**適用コンポーネント:**
- **Atoms:** Button, Badge, Icon
- **Molecules:** TableRow, TableHeader, ActionBar
- **Organisms:** VariablesTable, FilterPanel
- **Templates:** VariablesManagerLayout

**推定工数:** 3-4時間

#### 3. System Settings (`system-settings.html`)
**現状:**
- タブ切り替え
- 各種設定フォーム
- カラーピッカー

**適用コンポーネント:**
- **Atoms:** Button, Input, ColorPicker, Toggle
- **Molecules:** SettingRow, TabItem
- **Organisms:** SettingsForm, TabBar
- **Templates:** SettingsLayout

**推定工数:** 3-4時間

### 中優先度

#### 4. Storage Sync Manager (`storage-sync-manager.html`)
**推定工数:** 2-3時間

### 低優先度（シンプルまたは使用頻度低）

#### 5. Master Password Setup (`master-password-setup.html`)
**推定工数:** 1-2時間

#### 6. Unlock (`unlock.html`)
**推定工数:** 1時間

#### 7. Offscreen (`offscreen.html`)
**推定工数:** 0.5時間（バックグラウンド処理用）

---

## 共通コンポーネントライブラリ

### 既存（Popup UI で作成済み）
- `atoms/IconButton.ts`
- `atoms/StatusBadge.ts`
- `atoms/ActionButton.ts`
- `molecules/WebsiteCard.ts`
- `molecules/EmptyState.ts`

### 新規作成が必要
#### Atoms
- `atoms/Button.ts` - 汎用ボタン
- `atoms/Input.ts` - 汎用入力フィールド
- `atoms/Select.ts` - セレクトボックス
- `atoms/Textarea.ts` - テキストエリア
- `atoms/Checkbox.ts` - チェックボックス
- `atoms/Toggle.ts` - トグルスイッチ
- `atoms/Badge.ts` - 汎用バッジ
- `atoms/Icon.ts` - アイコン
- `atoms/ColorPicker.ts` - カラーピッカー

#### Molecules
- `molecules/FormField.ts` - ラベル付きフォームフィールド
- `molecules/TableRow.ts` - テーブル行
- `molecules/TableHeader.ts` - テーブルヘッダー
- `molecules/FilterBar.ts` - フィルターバー
- `molecules/ActionBar.ts` - アクションバー
- `molecules/TabItem.ts` - タブアイテム

#### Organisms
- `organisms/Table.ts` - データテーブル
- `organisms/Navigation.ts` - ナビゲーションバー
- `organisms/FilterPanel.ts` - フィルターパネル
- `organisms/TabBar.ts` - タブバー

---

## 実装戦略

### フェーズ1: 共通コンポーネントライブラリ構築（2-3時間）
1. 汎用Atomsコンポーネントの作成
2. 汎用Moleculesコンポーネントの作成
3. 汎用Organismsコンポーネントの作成

### フェーズ2: 高優先度画面の適用（10-14時間）
1. XPath Manager
2. Automation Variables Manager
3. System Settings

### フェーズ3: 中・低優先度画面の適用（4-6時間）
1. Storage Sync Manager
2. Master Password Setup
3. Unlock
4. Offscreen

### フェーズ4: テストと品質保証（2-3時間）
1. 全画面のE2Eテスト作成・更新
2. ユニットテスト追加
3. Lint・ビルド確認

---

## 設計原則

### 1. 再利用性
- PopupUIで作成したコンポーネントを最大限再利用
- 画面固有のコンポーネントは最小限に

### 2. 一貫性
- すべての画面で統一されたデザインシステム
- Tailwind CSSのユーティリティクラスを使用
- 同じカラーパレット、フォントサイズ、余白

### 3. アクセシビリティ
- すべてのフォーム要素にラベル
- キーボードナビゲーション対応
- ARIA属性の適切な使用

### 4. i18n対応
- すべてのテキストにdata-i18n属性
- I18nAdapterを使用した動的翻訳

### 5. Alpine.js統合
- すべての画面でAlpine.jsを使用
- リアクティブなデータバインディング
- イベント駆動のアーキテクチャ

---

## 期待される効果

### コード削減
- **推定削減量:** 500-800行
- 重複コードの排除
- コンポーネントの再利用

### 保守性向上
- 責任分離の明確化
- テストの容易性向上
- バグ修正の効率化

### ユーザー体験向上
- 統一されたUI/UX
- レスポンシブ対応
- パフォーマンス改善

---

## 次のステップ

### 即座に開始可能
1. **フェーズ1の開始** - 共通コンポーネントライブラリ構築
2. **XPath Managerへの適用** - 最も複雑な画面から

### 段階的アプローチ
- 1画面ずつ完成させてからコミット
- テストを都度実行して品質確保
- ドキュメント更新を並行実施

---

## タイムライン（推定）

- **フェーズ1:** 2-3時間
- **フェーズ2:** 10-14時間
- **フェーズ3:** 4-6時間
- **フェーズ4:** 2-3時間

**合計:** 18-26時間

**注意:** これは1つの画面ごとに区切って実施可能です。
