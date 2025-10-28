# データ同期 競合解決ガイド

**最終更新**: 2025-10-18

---

## 📋 目次

1. [競合解決とは](#競合解決とは)
2. [競合が発生する状況](#競合が発生する状況)
3. [競合解決ポリシー](#競合解決ポリシー)
4. [ユーザー確認ダイアログの使い方](#ユーザー確認ダイアログの使い方)
5. [ベストプラクティス](#ベストプラクティス)
6. [トラブルシューティング](#トラブルシューティング)

---

## 競合解決とは

**競合（Conflict）**とは、ローカル（Chrome Storage）とリモート（Notion、Googleスプレッドシート）のデータが異なる状態で、双方向同期を行う際にどちらのデータを採用すべきか判断が必要な状況です。

### 競合が発生するシナリオ例

```
1. ローカルでデータを編集
2. 同期前にリモート側でも同じデータを編集
3. 双方向同期を実行
→ 競合発生！どちらのデータを採用するか決定が必要
```

---

## 競合が発生する状況

競合は以下の条件がすべて満たされた場合に発生します:

### 必要条件

✅ **双方向同期** (`syncDirection: 'bidirectional'`)
　受信のみ (`receive_only`) や送信のみ (`send_only`) では競合は発生しません

✅ **ローカルとリモートのデータが異なる**
　JSON deep comparisonで差分が検出された場合

✅ **タイムスタンプが異なる**
　最終更新時刻が異なる場合

### 競合が発生しない状況

❌ 受信のみモード - ローカルは常に上書きされる
❌ 送信のみモード - リモートは常に上書きされる
❌ データが完全に同一 - 同期の必要なし

---

## 競合解決ポリシー

データ同期機能では、4つの競合解決ポリシーを提供しています。

### 1. 最新タイムスタンプ優先 (`latest_timestamp`) 【推奨】

**説明**: タイムスタンプを比較し、最新のデータを自動的に採用します。

**動作**:
- ローカルのタイムスタンプ > リモートのタイムスタンプ → **ローカルを採用**
- リモートのタイムスタンプ > ローカルのタイムスタンプ → **リモートを採用**
- タイムスタンプが同じ → **ローカルを採用**（デフォルト）

**適用シーン**:
- 通常の自動同期
- 定期実行同期
- 単一ユーザーでの利用

**メリット**:
- ✅ 自動解決で手間がかからない
- ✅ 最新データが常に反映される
- ✅ タイムスタンプベースで信頼性が高い

**設定方法**:
```typescript
const config = StorageSyncConfig.create({
  // ... other settings
  conflictResolution: 'latest_timestamp', // デフォルト
});
```

---

### 2. ローカル優先 (`local_priority`)

**説明**: 競合時は常にローカルデータを採用します。

**動作**:
- 競合発生時 → **ローカルデータを採用**
- リモートデータは上書きされる

**適用シーン**:
- ローカル編集を優先したい場合
- リモートデータを信頼しない場合
- 一時的にローカル変更を保護したい場合

**メリット**:
- ✅ ローカル変更が常に保護される
- ✅ 予測可能な動作
- ✅ ローカル作業を最優先

**注意点**:
- ⚠️ リモートの変更が失われる可能性
- ⚠️ 他ユーザーの変更を上書きする可能性（複数ユーザー環境）

**設定方法**:
```typescript
const config = StorageSyncConfig.create({
  // ... other settings
  conflictResolution: 'local_priority',
});
```

---

### 3. リモート優先 (`remote_priority`)

**説明**: 競合時は常にリモートデータを採用します。

**動作**:
- 競合発生時 → **リモートデータを採用**
- ローカルデータは上書きされる

**適用シーン**:
- リモートを信頼できる情報源とする場合
- 複数デバイス間で統一したい場合
- マスターデータがリモートにある場合

**メリット**:
- ✅ リモートデータが常に反映される
- ✅ 複数デバイス間でのデータ統一
- ✅ マスターデータの保護

**注意点**:
- ⚠️ ローカルの変更が失われる可能性
- ⚠️ 予期しないデータ上書きの可能性

**設定方法**:
```typescript
const config = StorageSyncConfig.create({
  // ... other settings
  conflictResolution: 'remote_priority',
});
```

---

### 4. ユーザー確認 (`user_confirm`) 【最も安全】

**説明**: 競合時にユーザーに確認ダイアログを表示し、手動で選択します。

**動作**:
1. 競合を検出
2. **ユーザー確認ダイアログを表示**
3. ユーザーがローカル/リモート/キャンセルを選択
4. 選択されたデータを採用

**適用シーン**:
- 重要なデータの同期
- 複数ユーザー環境
- 慎重な判断が必要な場合

**メリット**:
- ✅ **最も安全** - データ損失のリスクが最小
- ✅ ユーザーがデータ内容を確認して選択
- ✅ タイムスタンプと推奨情報を表示

**注意点**:
- ⚠️ 手動操作が必要（自動化されない）
- ⚠️ ダイアログが表示されるまで同期が待機

**設定方法**:
```typescript
const config = StorageSyncConfig.create({
  // ... other settings
  conflictResolution: 'user_confirm',
});
```

---

## ユーザー確認ダイアログの使い方

`user_confirm` ポリシーを設定すると、競合発生時に以下のダイアログが表示されます。

### ダイアログの構成

```
┌─────────────────────────────────────────────────────┐
│ ⚠️ データ競合が発生しました                         │
│                                                       │
│ ローカルとリモート（Notion）のデータが異なります。 │
│ どちらのデータを使用するか選択してください。       │
├─────────────────────────────────────────────────────┤
│ ストレージキー: automationVariables                 │
│                                                       │
│ ┌────────────────┐   VS   ┌────────────────┐       │
│ │💻 ローカルデータ│        │☁️ リモートデータ│       │
│ │更新: 2024/10/18 │        │更新: 2024/10/17 │       │
│ │15:30:00         │        │10:00:00         │       │
│ │                 │        │                 │       │
│ │{ name: "foo",   │        │{ name: "bar",   │       │
│ │  value: 123 }   │        │  value: 456 }   │       │
│ └────────────────┘        └────────────────┘       │
│                                                       │
│ 💡 推奨: ローカルデータの方が新しいです（5時間後）│
├─────────────────────────────────────────────────────┤
│ [💻 ローカルを使用] [☁️ リモートを使用] [キャンセル] │
└─────────────────────────────────────────────────────┘
```

### ダイアログの要素

| 要素 | 説明 |
|------|------|
| **ストレージキー** | 競合が発生したデータのキー |
| **ローカルデータ** | 現在のChrome Storageのデータ |
| **リモートデータ** | Notion/Googleスプレッドシートのデータ |
| **更新日時** | 各データの最終更新タイムスタンプ |
| **推奨** | タイムスタンプに基づく推奨（参考情報） |

### 選択肢

| ボタン | 動作 | 結果 |
|--------|------|------|
| **💻 ローカルを使用** | ローカルデータを採用 | ローカル→リモートへ送信（上書き） |
| **☁️ リモートを使用** | リモートデータを採用 | リモート→ローカルへ受信（上書き） |
| **キャンセル** | 同期をキャンセル | 両方のデータを保持（変更なし） |

### キーボードショートカット

- **Escキー**: キャンセル（同期中止）
- **モーダル背景クリック**: キャンセル

---

## ベストプラクティス

### 1. ポリシー選択のガイドライン

#### 通常の利用（単一ユーザー）
```typescript
conflictResolution: 'latest_timestamp' // 推奨
```
- 自動的に最新データを採用
- 手間がかからない

#### 重要なデータ（慎重に扱いたい）
```typescript
conflictResolution: 'user_confirm' // 推奨
```
- ユーザーが目視確認
- データ損失リスク最小

#### 複数ユーザー環境（チーム利用）
```typescript
conflictResolution: 'user_confirm' // 推奨
// または
conflictResolution: 'remote_priority' // リモートをマスターとする場合
```

#### ローカル作業優先（オフライン作業が多い）
```typescript
conflictResolution: 'local_priority'
```
- ローカル変更を最優先
- リモート変更は無視

---

### 2. タイムスタンプ管理のベストプラクティス

✅ **DO (推奨)**:
- システムクロックを正確に保つ
- ISO 8601形式のタイムスタンプを使用
- タイムゾーンを統一（UTC推奨）

❌ **DON'T (非推奨)**:
- 手動でタイムスタンプを変更しない
- 異なるタイムゾーンでの混在運用
- システム時刻の不正確な設定

---

### 3. 競合を減らすテクニック

#### 同期間隔の最適化
```typescript
// 定期同期の間隔を短くする
syncTiming: 'periodic',
syncIntervalSeconds: 300, // 5分ごと（推奨）
```
→ 同期間隔が短いほど競合が発生しにくい

#### 同期方向の使い分け
```typescript
// 読み取り専用のデータは受信のみ
syncDirection: 'receive_only',

// 書き込み専用のデータは送信のみ
syncDirection: 'send_only',
```
→ 双方向同期が本当に必要かを検討

#### データの分割
```typescript
// 頻繁に変更されるデータと静的データを分ける
const dynamicConfig = StorageSyncConfig.create({
  storageKey: 'dynamicData',
  conflictResolution: 'user_confirm',
});

const staticConfig = StorageSyncConfig.create({
  storageKey: 'staticData',
  conflictResolution: 'latest_timestamp',
});
```

---

## トラブルシューティング

### Q1: ユーザー確認ダイアログが表示されない

**原因**:
- `conflictResolution` が `'user_confirm'` に設定されていない
- 競合が発生していない（データが同一）
- `syncDirection` が `'bidirectional'` ではない

**解決方法**:
```typescript
// 設定を確認
const config = StorageSyncConfig.create({
  syncDirection: 'bidirectional', // 必須
  conflictResolution: 'user_confirm', // 必須
});
```

---

### Q2: 常にローカルが採用される（リモート変更が反映されない）

**原因**:
- `conflictResolution: 'local_priority'` に設定されている
- または `latest_timestamp` でローカルのタイムスタンプが新しい

**解決方法**:
```typescript
// ポリシーを変更
conflictResolution: 'remote_priority', // リモート優先
// または
conflictResolution: 'user_confirm', // 手動選択
```

---

### Q3: タイムスタンプが不正確

**原因**:
- システムクロックがずれている
- タイムゾーンが異なる

**解決方法**:
1. システムクロックを正確に設定
2. NTP（Network Time Protocol）で自動同期を有効化
3. タイムゾーンをUTCに統一

---

### Q4: キャンセルしたのにデータが変更された

**原因**:
- ダイアログで「キャンセル」を選択した場合、データは変更されません
- 別の同期処理が実行された可能性

**解決方法**:
- 同期履歴を確認（`showSyncHistories`）
- ログを確認して原因を特定

---

### Q5: 競合解決後もエラーが発生する

**原因**:
- データ形式が不正
- リトライ処理の失敗

**解決方法**:
```typescript
// リトライポリシーを設定
const retryPolicy = RetryPolicy.create({
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
});

const config = StorageSyncConfig.create({
  // ... other settings
  retryPolicy: retryPolicy.toData(),
});
```

---

## まとめ

### ポリシー選択フローチャート

```
開始
  ↓
重要なデータ？ → YES → user_confirm（ユーザー確認）
  ↓ NO
複数ユーザー環境？ → YES → user_confirm または remote_priority
  ↓ NO
ローカル作業優先？ → YES → local_priority
  ↓ NO
通常利用 → latest_timestamp（推奨）
```

### 推奨設定

```typescript
// 推奨: 通常利用
const config = StorageSyncConfig.create({
  storageKey: 'automationVariables',
  syncMethod: 'notion',
  syncTiming: 'periodic',
  syncIntervalSeconds: 300, // 5分
  syncDirection: 'bidirectional',
  conflictResolution: 'latest_timestamp', // デフォルト推奨
  inputs: [
    { key: 'apiKey', value: 'your-api-key' },
    { key: 'databaseId', value: 'your-database-id' },
  ],
  outputs: [{ key: 'data', defaultValue: [] }],
});
```

---

## 関連ドキュメント

- [データ同期機能 実装状況レポート](../sync-feature-implementation-status.md)
- [クリーンアーキテクチャ改善計画](../clean-architecture-improvement-plan.md)
- [ドメインイベントガイド](../domain-events-guide.md)

---

**ご不明な点がございましたら、GitHubの[Issues](https://github.com/your-repo/issues)までお問い合わせください。**
