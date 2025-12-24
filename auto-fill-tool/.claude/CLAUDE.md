# Auto-Fill Tool - Claude Code Quality Assurance Rules

## 🔔 ユーザー通知ルール

**IMPORTANT**: Claudeがユーザーに選択や指示を求める前に、必ずSlack通知を送信してください。

### 通知を送るべき状況

以下のいずれかの状況では、**必ず`slackNotification.sh`を実行してからユーザーに問い合わせを行う**こと：

1. **AskUserQuestionツールを使用する前**
   - 実装方法の選択肢を提示する場合
   - アーキテクチャやライブラリの選択を求める場合
   - 仕様の不明点について確認が必要な場合

2. **次の指示を待つ必要がある場合**
   - 作業が完了し、次のタスクの指示を待つ時
   - エラーや問題が発生し、ユーザーの判断が必要な時
   - 長時間実行されるコマンド（ビルド、テスト等）が完了した時

3. **重要な意思決定が必要な場合**
   - 破壊的な変更を行う前の確認
   - データの削除や大規模なリファクタリングの承認
   - セキュリティに関わる変更の確認

4. **ファイルアクセスやコマンド実行の許可が必要な場合**
   - ユーザー承認が必要なファイルへのアクセスを行う前
   - ユーザー承認が必要なコマンドを実行する前
   - セキュリティ上重要なツール使用の承認を求める場合

### 通知スクリプトの実行方法

```bash
bash slackNotification.sh "[$$]実施中のタスク要約" "状況詳細"
```

**引数の説明:**
- 第1引数（必須）: 実施中のタスク要約（何を行っているか）
  - **IMPORTANT**: タスク要約の先頭に`[$$]`プレフィックスを付けて、プロセスIDを含めること
  - 形式: `[$$]タスクの説明`
  - 例: `[$$]ユーザー認証機能の実装`
  - `$$`はシェルスクリプト内で自動的に実行中のプロセスIDに展開されます
- 第2引数（オプション）: 状況詳細（なぜ通知が必要か、次に何をすべきか）
  - 省略時のデフォルト: "確認が必要です"

**通知形式:**
Slackブロック形式で以下の構造で送信されます：
```
実施中のタスク:
[12345]タスク要約

状況:
<状況詳細>
```
※ `[12345]` の部分は実際のプロセスIDに置き換えられます

### 実行例

```typescript
// 例1: ユーザーに選択肢を提示する前
// 1. まずSlack通知を送信
Bash: bash slackNotification.sh \
  "[$$]認証機能の実装" \
  "認証方式の選択が必要です。Claudeからの質問を確認してください。"

// 2. その後、AskUserQuestionツールを使用
AskUserQuestion: {
  questions: [{
    question: "認証方式を選択してください",
    header: "Auth method",
    options: [...]
  }]
}

// 例2: 作業完了後の報告前
// 1. Slack通知を送信
Bash: bash slackNotification.sh \
  "[$$]変数名のリネーム作業" \
  "リネーム作業が完了しました。次のタスクの指示をお願いします。"

// 2. 完了報告とともに次の指示を依頼
Output: "リネーム作業が完了しました。次のタスクについてご指示ください。"

// 例3: 長時間コマンドの完了通知
Bash: bash slackNotification.sh \
  "[$$]プロジェクトのビルド" \
  "ビルドが完了しました。3件のwarningがあります。結果を確認してください。"

// 例4: エラー発生時
Bash: bash slackNotification.sh \
  "[$$]テストの実行" \
  "5件のテストが失敗しています。エラーログの確認とユーザーの判断が必要です。"

// 例5: ユーザーによるリクエスト中断時
Bash: bash slackNotification.sh \
  "[$$][Request interrupted by user] データベーススキーマの変更" \
  "作業が中断されました。再開するには指示をお願いします。"

// 例6: ファイルアクセス・コマンド実行の許可を求める前
// 1. Slack通知を送信
Bash: bash slackNotification.sh \
  "[$$]システムファイルの編集" \
  "/etc/hostsファイルへの書き込み許可が必要です。Claudeからの承認リクエストを確認してください。"

// 2. ユーザーに承認を求める（Claude Codeの許可システム経由）
// ユーザーが許可を与えるまで待機

// 例7: 複数行のメッセージ（改行を含む）
Bash: bash slackNotification.sh \
  "[$$]依存パッケージの更新" \
  "以下のパッケージの更新確認が必要です:
- react: 18.2.0 → 18.3.0
- typescript: 5.0.4 → 5.3.0
承認をお願いします。"
```

### メッセージのガイドライン

通知メッセージは**簡潔で具体的**に記述してください：

#### タスク要約（第1引数）の書き方

**✅ 良い例:**
- "[$$]ユーザー認証機能の実装"
- "[$$]テストカバレッジの改善"
- "[$$]データベーススキーマの変更"
- "[$$]依存パッケージの更新"
- "[$$]リファクタリング: ファイル構造の整理"

**❌ 悪い例:**
- "作業中" （PIDプレフィックスなし、何の作業か不明）
- "実装" （PIDプレフィックスなし、何を実装しているか不明）
- "[$$]修正" （内容が不明確）
- "ユーザー認証機能の実装" （PIDプレフィックスなし）

#### 状況詳細（第2引数）の書き方

**✅ 良い例:**
- "認証方式（JWT/OAuth/Session）の選択が必要です。質問を確認してください。"
- "テストが完了しました。3件のエラーがあります。確認をお願いします。"
- "/etc/hostsファイルへの書き込み許可が必要です。承認をお願いします。"
- "ビルドが完了しました。5件のwarningがあります。結果を確認してください。"
- "エラーが発生しました:
TypeError: Cannot read property 'name' of undefined
修正方針の確認が必要です。"

**❌ 悪い例:**
- "確認してください。" （何を確認するか不明）
- "許可が必要です。" （何の許可か不明）
- "エラーです。" （どんなエラーか不明）
- "完了しました。" （結果や次のアクションが不明）

#### ベストプラクティス

1. **PIDプレフィックスは必須**: タスク要約の先頭に必ず`[$$]`を付ける
2. **タスク要約は名詞形で**: "[$$]〜の実装"、"[$$]〜の修正"、"[$$]〜の更新"
3. **状況詳細は具体的に**: 数値、エラーメッセージ、次のアクションを含める
4. **長い情報は改行を活用**: 複数の項目は箇条書きで
5. **緊急度を示す**: 必要に応じて絵文字（⚠️、✅、❌）を使用可能

### 注意事項

- **PIDプレフィックスは必須**: タスク要約の先頭に必ず`[$$]`を付けること。`$$`はシェルスクリプト内でプロセスIDに自動展開されます
- スクリプトはプロジェクトルート（`auto-fill-tool/`）に配置されています
- 通知は非同期で送信されるため、実行後すぐにユーザーへの問い合わせを続行できます
- スクリプトの実行エラーは無視して構いません（通知の失敗で作業を止めないこと）
- 第2引数（状況詳細）を省略した場合、デフォルトで"確認が必要です"が設定されます
- 改行を含むメッセージも正しく送信されます（JSONエスケープ処理済み）

### 環境変数の設定（初回のみ）

スクリプトを使用するには、以下の環境変数が必要です：

```bash
export MY_SLACK_OAUTH_TOKEN='xoxb-your-bot-token'
export MY_SLACK_USER_ID='U1234567890'
```

**使用例（環境変数設定済み）:**
```bash
# シンプルな通知（第2引数省略）
bash slackNotification.sh "[$$]テストの実行"

# 詳細を含む通知
bash slackNotification.sh "[$$]テストの実行" "5件のテストが失敗しました。確認してください。"
```

環境変数が未設定の場合、スクリプトはエラーメッセージを表示しますが、**Claudeの作業は継続してください**（通知機能は補助機能のため）。

---

## 📝 TypeScript実装ファイルの命名規則

**IMPORTANT**: 実装を含む`.ts`ファイルの命名規則は、_ファイルの種類によって使い分ける_のが一般的です。

### 命名規則の種類

#### 1. PascalCase (アッパーキャメル) を使用

以下の場合に使用します：

- **Reactコンポーネント**: `UserProfile.tsx`, `Button.tsx`
- **クラス定義**: `UserService.ts`, `DatabaseConnection.ts`
- **Angular等のコンポーネント**: `UserComponent.ts`

#### 2. kebab-case (小文字+ハイフン) を使用

以下の場合に使用します：

- **ユーティリティ関数**: `string-utils.ts`, `date-helper.ts`
- **設定ファイル**: `api-config.ts`, `database-config.ts`
- **型定義ファイル**: `user.types.ts`, `api-response.types.ts`
- **フック (React)**: `use-user-data.ts`, `use-auth.ts`

#### 3. camelCase (ローワーキャメル) を使用

- あまり一般的ではありませんが、一部のプロジェクトで使用されることがあります
- このプロジェクトでは**非推奨**です

### プロジェクト内の推奨される使い分け

```
src/
  components/
    UserProfile.tsx              # PascalCase (コンポーネント)
    Button.tsx                   # PascalCase (コンポーネント)

  services/
    UserService.ts               # PascalCase (クラス)
    DatabaseConnection.ts        # PascalCase (クラス)

  utils/
    string-utils.ts              # kebab-case (関数群)
    date-helper.ts               # kebab-case (関数群)

  types/
    user.types.ts                # kebab-case (型定義)
    api-response.types.ts        # kebab-case (型定義)

  hooks/
    use-user-data.ts             # kebab-case (フック)
    use-auth.ts                  # kebab-case (フック)

  domain/
    entities/
      User.ts                    # PascalCase (エンティティクラス)
      Product.ts                 # PascalCase (エンティティクラス)

    types/
      user.types.ts              # kebab-case (型定義)
      product.types.ts           # kebab-case (型定義)

    services/
      UserValidationService.ts   # PascalCase (ドメインサービスクラス)
      OrderProcessingService.ts  # PascalCase (ドメインサービスクラス)

    values/
      Email.ts                   # PascalCase (値オブジェクトクラス)
      Money.ts                   # PascalCase (値オブジェクトクラス)

  infrastructure/
    adapters/
      HttpClient.ts              # PascalCase (アダプタークラス)
      DatabaseAdapter.ts         # PascalCase (アダプタークラス)

    repositories/
      UserRepository.ts          # PascalCase (リポジトリクラス)
      ProductRepository.ts       # PascalCase (リポジトリクラス)

  presentation/
    types/
      popup.types.ts             # kebab-case (型定義)
      background.types.ts        # kebab-case (型定義)
```

### 命名規則の判断基準

1. **クラスベース（OOP）の実装** → **PascalCase**
   - コンストラクタを持つクラス
   - インスタンス化されるもの
   - 継承やポリモーフィズムを使用するもの

2. **関数ベース（FP）の実装** → **kebab-case**
   - ユーティリティ関数の集合
   - 純粋関数
   - ヘルパー関数群

3. **型定義のみ** → **kebab-case**
   - インターフェースや型エイリアスのみ
   - 実装を含まない

### 例外ケース

- **フレームワークの規約が優先される場合**:
  - Reactのコンポーネント: 常に`PascalCase`
  - Next.jsの`pages/`ディレクトリ: フレームワークのルーティング規約に従う

- **既存のコードベースとの整合性**:
  - 既存のプロジェクトスタイルがある場合、そちらを優先

---

## 📐 TypeScript型定義・インターフェース規約

**IMPORTANT**: TypeScriptの型定義とインターフェースを作成・配置する際は、以下の規約に従ってください。

### ファイル名の命名規則

型定義ファイルは用途に応じて以下のパターンで命名してください：

1. **types.ts**
   - プロジェクト全体で使用する共通の型定義
   - 汎用的な型や複数の機能で共有される型
   - 例: `src/types/types.ts`, `src/common/types.ts`

2. **[機能名].types.ts**
   - 特定の機能やドメインに関連する型定義
   - 機能名を明確に示す
   - 例: `user.types.ts`, `api.types.ts`, `storage.types.ts`, `sync.types.ts`

3. **interfaces.ts**
   - インターフェースをまとめる場合に使用
   - 主に抽象的な契約や共通インターフェースを定義
   - 例: `src/interfaces/interfaces.ts`

4. **models.ts**
   - データモデルの型定義
   - エンティティやドメインモデルの型
   - 例: `src/models/models.ts`, `user.models.ts`

### インターフェース名・型名の命名規則

#### 基本ルール

1. **PascalCaseを使用**
   ```typescript
   // ✅ 良い例
   interface UserProfile { ... }
   type ApiResponse = { ... }
   interface ProductData { ... }

   // ❌ 悪い例
   interface userProfile { ... }  // camelCase
   type api_response = { ... }    // snake_case
   ```

2. **プレフィックス`I`は非推奨**
   ```typescript
   // ✅ 良い例
   interface User { ... }
   interface Repository { ... }

   // ❌ 悪い例（古いC#スタイル）
   interface IUser { ... }
   interface IRepository { ... }
   ```

3. **具体的で説明的な名前を使用**
   ```typescript
   // ✅ 良い例
   interface UserData { ... }
   interface SyncResult { ... }
   type StorageState = { ... }

   // ❌ 悪い例（曖昧すぎる）
   interface Data { ... }
   interface Result { ... }
   type State = { ... }
   ```

#### 型の種類別の命名パターン

1. **状態を表す型**: `〜State`, `〜Status`
   ```typescript
   interface SyncState { ... }
   type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
   ```

2. **設定を表す型**: `〜Config`, `〜Options`, `〜Settings`
   ```typescript
   interface DatabaseConfig { ... }
   type ApiOptions = { ... }
   ```

3. **レスポンスを表す型**: `〜Response`, `〜Result`
   ```typescript
   interface ApiResponse<T> { ... }
   type SyncResult = { ... }
   ```

4. **リクエストを表す型**: `〜Request`, `〜Params`
   ```typescript
   interface LoginRequest { ... }
   type SearchParams = { ... }
   ```

5. **イベントを表す型**: `〜Event`, `〜Handler`
   ```typescript
   interface ClickEvent { ... }
   type EventHandler = (event: Event) => void;
   ```

### 型定義の配置ルール

#### 配置の判断基準

1. **同じファイル内に配置する場合**
   ```typescript
   // ✅ その型が1つのファイルでのみ使用される場合
   // src/usecases/LoginUseCase.ts

   type LoginCredentials = {
     username: string;
     password: string;
   };

   export class LoginUseCase {
     execute(credentials: LoginCredentials) { ... }
   }
   ```

2. **専用の型ファイルに配置する場合**
   ```typescript
   // ✅ 複数のファイルで共有される場合
   // src/types/auth.types.ts

   export interface User {
     id: string;
     username: string;
     email: string;
   }

   export interface AuthToken {
     accessToken: string;
     refreshToken: string;
     expiresAt: number;
   }
   ```

#### レイヤー別の型配置原則（クリーンアーキテクチャ）

**IMPORTANT**: 複数のレイヤーで使用される型は、依存関係の方向に従って配置してください。

**基本原則:**
- **内側のレイヤーに配置**: 複数のレイヤーで使用される型は、最も内側のレイヤー（通常は`domain`層）に配置
- **凝集度の向上**: 関連する型は同じレイヤー内にまとめる
- **依存の方向**: 外側のレイヤーは内側のレイヤーの型を参照できるが、逆は不可

**レイヤー別の配置ルール:**

1. **Domain層（最も内側）**
   - エンティティやドメインモデルの型
   - 複数のレイヤーで共有されるコアな型
   - ビジネスルールに関連する型

   ```typescript
   // ✅ src/domain/entities/user.types.ts
   export interface User {
     id: string;
     username: string;
     email: string;
   }

   // ✅ src/domain/value-objects/email.types.ts
   export type Email = string & { readonly __brand: 'Email' };
   ```

2. **UseCase層（Application層）**
   - UseCase固有の入力・出力型
   - Domain層の型を組み合わせて使用
   - 他のUseCaseと共有しない型

   ```typescript
   // ✅ src/usecases/user/CreateUserUseCase.ts
   import { User } from '@/domain/entities/user.types';

   // このUseCaseでのみ使う型
   type CreateUserInput = {
     username: string;
     email: string;
     password: string;
   };

   type CreateUserOutput = {
     user: User;
     token: string;
   };
   ```

3. **Infrastructure層（最も外側）**
   - 外部サービスとの接続に関する型
   - APIレスポンス、データベーススキーマなど
   - Infrastructure層内でのみ使用される型

   ```typescript
   // ✅ src/infrastructure/api/api.types.ts
   import { User } from '@/domain/entities/user.types';

   // API固有の型（Infrastructure層でのみ使用）
   export interface ApiUserResponse {
     id: string;
     username: string;
     email: string;
     created_at: string;  // APIはsnake_case
   }

   // APIレスポンスをDomainモデルに変換
   export function toUser(response: ApiUserResponse): User {
     return {
       id: response.id,
       username: response.username,
       email: response.email,
     };
   }
   ```

4. **Presentation層（最も外側）**
   - UIコンポーネント固有の型
   - イベントハンドラーの型
   - ビューモデルの型

   ```typescript
   // ✅ src/presentation/components/UserProfile/types.ts
   import { User } from '@/domain/entities/user.types';

   export interface UserProfileProps {
     user: User;
     onEdit: (user: User) => void;
     onDelete: (userId: string) => void;
   }
   ```

**依存関係の図:**
```
┌─────────────────────────────────┐
│ Presentation Layer              │
│ (UI固有の型)                     │
│ ↓ 依存可能                       │
├─────────────────────────────────┤
│ Infrastructure Layer            │
│ (API、DB固有の型)                │
│ ↓ 依存可能                       │
├─────────────────────────────────┤
│ UseCase Layer (Application)     │
│ (UseCase固有の型)                │
│ ↓ 依存可能                       │
├─────────────────────────────────┤
│ Domain Layer                    │
│ (共有される型、エンティティ)      │
│ ↑ 依存不可（独立している）       │
└─────────────────────────────────┘
```

**実践例:**

```typescript
// ❌ 悪い例: Domain層がInfrastructure層の型に依存
// src/domain/entities/User.ts
import { ApiUserResponse } from '@/infrastructure/api/api.types';  // NG!

export class User {
  constructor(private apiResponse: ApiUserResponse) {}  // NG!
}

// ✅ 良い例: Infrastructure層がDomain層の型を使用
// src/domain/entities/user.types.ts
export interface User {
  id: string;
  username: string;
  email: string;
}

// src/infrastructure/api/UserApiClient.ts
import { User } from '@/domain/entities/user.types';  // OK!

export class UserApiClient {
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();

    // APIレスポンスをDomainモデルに変換
    return {
      id: data.id,
      username: data.username,
      email: data.email,
    };
  }
}
```

**配置のチェックリスト:**

- ✅ この型は複数のレイヤーで使われるか？ → Domain層へ
- ✅ この型は特定のUseCaseでのみ使われるか？ → UseCaseファイル内へ
- ✅ この型はAPI/DBに固有か？ → Infrastructure層へ
- ✅ この型はUI固有か？ → Presentation層へ
- ✅ 依存の方向は正しいか？ → 外→内のみ（内→外は禁止）

### ディレクトリ構造例（クリーンアーキテクチャ）

**IMPORTANT**: 各レイヤーのルートディレクトリ直下に`types/`ディレクトリを配置してください。

```
src/
├── domain/                           # Domain層（最も内側）
│   ├── types/                        # ✅ Domain層の型をすべてここに集約
│   │   ├── index.ts                  # Domain層の型を集約エクスポート
│   │   ├── user.types.ts             # ユーザー関連の型
│   │   ├── product.types.ts          # プロダクト関連の型
│   │   ├── email.types.ts            # Email ValueObjectの型
│   │   └── common.types.ts           # Domain層の共通型（Result, Option など）
│   ├── entities/
│   │   ├── User.ts
│   │   └── Product.ts
│   ├── value-objects/
│   │   └── Email.ts
│   └── repositories/
│       ├── UserRepository.ts         # インターフェースのみ
│       └── ProductRepository.ts
│
├── usecases/                         # UseCase層（Application層）
│   ├── types/                        # ✅ UseCase層の共有型をここに集約
│   │   ├── index.ts                  # UseCase層の型を集約エクスポート
│   │   ├── user.types.ts             # ユーザーUseCaseで共有する型
│   │   └── common.types.ts           # UseCase層の共通型
│   ├── user/
│   │   ├── CreateUserUseCase.ts      # UseCase固有の型はファイル内に定義
│   │   ├── UpdateUserUseCase.ts
│   │   └── DeleteUserUseCase.ts
│   └── product/
│       ├── CreateProductUseCase.ts
│       └── UpdateProductUseCase.ts
│
├── infrastructure/                   # Infrastructure層
│   ├── types/                        # ✅ Infrastructure層の型をすべてここに集約
│   │   ├── index.ts                  # Infrastructure層の型を集約エクスポート
│   │   ├── api.types.ts              # API関連の型
│   │   ├── storage.types.ts          # ストレージ関連の型
│   │   ├── database.types.ts         # データベース関連の型
│   │   └── dto.types.ts              # Data Transfer Objects
│   ├── api/
│   │   ├── UserApiClient.ts
│   │   └── ProductApiClient.ts
│   ├── storage/
│   │   └── LocalStorageRepository.ts
│   ├── database/
│   │   └── DatabaseClient.ts
│   └── repositories/
│       ├── UserRepositoryImpl.ts     # Domain層のインターフェースを実装
│       └── ProductRepositoryImpl.ts
│
├── presentation/                     # Presentation層（最も外側）
│   ├── types/                        # ✅ Presentation層の型をすべてここに集約
│   │   ├── index.ts                  # Presentation層の型を集約エクスポート
│   │   ├── component.types.ts        # コンポーネント共通の型
│   │   ├── view.types.ts             # ビュー関連の型
│   │   └── event.types.ts            # イベント関連の型
│   ├── components/
│   │   ├── UserProfile/
│   │   │   ├── UserProfile.tsx
│   │   │   └── UserProfile.presenter.ts
│   │   └── ProductList/
│   │       ├── ProductList.tsx
│   │       └── ProductList.presenter.ts
│   └── views/
│       ├── UserView.tsx
│       └── ProductView.tsx
│
└── types/                            # プロジェクト全体の共通型（レイヤー横断）
    ├── index.ts                      # すべての共通型を集約
    ├── common.types.ts               # プロジェクト全体で使う型
    └── utility.types.ts              # TypeScriptユーティリティ型の拡張
```

**レイヤー別の型ファイル配置の例:**

```typescript
// ✅ Domain層: 複数レイヤーで使用される型
// src/domain/types/user.types.ts
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// src/domain/types/common.types.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// src/domain/types/index.ts
export * from './user.types';
export * from './product.types';
export * from './common.types';

// ✅ Infrastructure層: API固有の型
// src/infrastructure/types/api.types.ts
import { User } from '@/domain/types';

export interface ApiUserResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export function toUserEntity(response: ApiUserResponse): User {
  return {
    id: response.id,
    username: response.username,
    email: response.email,
    createdAt: new Date(response.created_at),
    updatedAt: new Date(response.updated_at),
  };
}

// src/infrastructure/types/storage.types.ts
export interface StorageConfig {
  prefix: string;
  expirationMs: number;
}

export interface StorageData<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

// src/infrastructure/types/index.ts
export * from './api.types';
export * from './storage.types';
export * from './database.types';
export * from './dto.types';

// ✅ UseCase層: 複数のUseCaseで共有する型
// src/usecases/types/user.types.ts
import { User } from '@/domain/types';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  id: string;
  username?: string;
  email?: string;
}

export interface UserUseCaseOutput {
  user: User;
  message: string;
}

// src/usecases/types/index.ts
export * from './user.types';
export * from './common.types';

// ✅ UseCase層: UseCase固有の型（ファイル内に定義）
// src/usecases/user/CreateUserUseCase.ts
import { Result, User } from '@/domain/types';
import { CreateUserInput } from '@/usecases/types';

// このUseCaseでのみ使う型
type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<Result<User>> {
    const validation = this.validate(input);
    if (!validation.isValid) {
      return { success: false, error: new Error(validation.errors.join(', ')) };
    }
    // ...
  }

  private validate(input: CreateUserInput): ValidationResult {
    // ...
  }
}

// ✅ Presentation層: コンポーネント間で共有する型
// src/presentation/types/component.types.ts
import { User } from '@/domain/types';

export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

export interface UserComponentProps extends BaseComponentProps {
  user: User;
}

// src/presentation/types/event.types.ts
import { User } from '@/domain/types';

export type UserEventHandler = (user: User) => void;
export type UserIdEventHandler = (userId: string) => void;

// src/presentation/types/index.ts
export * from './component.types';
export * from './view.types';
export * from './event.types';

// ✅ Presentation層: 特定のコンポーネントでのみ使う型（ファイル内に定義）
// src/presentation/components/UserProfile/UserProfile.tsx
import { User } from '@/domain/types';
import { UserEventHandler, UserIdEventHandler } from '@/presentation/types';

// このコンポーネントでのみ使う型
interface UserProfileProps {
  user: User;
  onEdit: UserEventHandler;
  onDelete: UserIdEventHandler;
}

interface UserProfileState {
  isEditing: boolean;
  isDirty: boolean;
  formData: Partial<User>;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onEdit, onDelete }) => {
  // ...
};
```

### index.ts による型の集約（必須）

**IMPORTANT**: 各レイヤーの`types/`ディレクトリ内に必ず`index.ts`を配置し、そのレイヤーのすべての型をエクスポートしてください。

```typescript
// ✅ Domain層の型を集約
// src/domain/types/index.ts
export * from './user.types';
export * from './product.types';
export * from './email.types';
export * from './common.types';

// ✅ UseCase層の型を集約
// src/usecases/types/index.ts
export * from './user.types';
export * from './product.types';
export * from './common.types';

// ✅ Infrastructure層の型を集約
// src/infrastructure/types/index.ts
export * from './api.types';
export * from './storage.types';
export * from './database.types';
export * from './dto.types';

// ✅ Presentation層の型を集約
// src/presentation/types/index.ts
export * from './component.types';
export * from './view.types';
export * from './event.types';

// ✅ プロジェクト全体の型を集約（トップレベル）
// src/types/index.ts
// Domain層の型を優先的にエクスポート
export * from '@/domain/types';
// 共通型
export * from './common.types';
export * from './utility.types';
```

**使用例（レイヤー別インポート）:**

```typescript
// ✅ 良い例: 各レイヤーのtypes/index.tsからインポート
import { User, Product, Result } from '@/domain/types';
import { CreateUserInput, UpdateUserInput } from '@/usecases/types';
import { ApiUserResponse, StorageConfig } from '@/infrastructure/types';
import { UserComponentProps, UserEventHandler } from '@/presentation/types';

// ✅ 良い例: プロジェクト全体の共通型をインポート
import { Result, Pagination } from '@/types';

// ❌ 悪い例: 個別の型ファイルから直接インポート（保守性が低い）
import { User } from '@/domain/types/user.types';
import { Product } from '@/domain/types/product.types';
import { CreateUserInput } from '@/usecases/types/user.types';
```

**レイヤーをまたいだインポートの例:**

```typescript
// ✅ UseCase層: Domain層の型をインポート（OK: 外→内）
// src/usecases/user/CreateUserUseCase.ts
import { User, Result } from '@/domain/types';
import { CreateUserInput } from '@/usecases/types';

export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<Result<User>> {
    // ...
  }
}

// ✅ Infrastructure層: Domain層の型をインポート（OK: 外→内）
// src/infrastructure/api/UserApiClient.ts
import { User } from '@/domain/types';
import { ApiUserResponse } from '@/infrastructure/types';

export class UserApiClient {
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    const data: ApiUserResponse = await response.json();
    // ...
  }
}

// ✅ Presentation層: Domain層とUseCase層の型をインポート（OK: 外→内）
// src/presentation/components/UserProfile/UserProfile.tsx
import { User } from '@/domain/types';
import { UserEventHandler } from '@/presentation/types';

interface UserProfileProps {
  user: User;
  onEdit: UserEventHandler;
}

// ❌ Domain層: Infrastructure層の型をインポート（NG: 内→外）
// src/domain/entities/User.ts
import { ApiUserResponse } from '@/infrastructure/types';  // 禁止！

// ❌ Domain層: UseCase層の型をインポート（NG: 内→外）
// src/domain/types/user.types.ts
import { CreateUserInput } from '@/usecases/types';  // 禁止！

// ❌ UseCase層: Infrastructure層の型をインポート（NG: 同列レイヤー間の依存）
// src/usecases/user/CreateUserUseCase.ts
import { ApiUserResponse } from '@/infrastructure/types';  // 禁止！

// ❌ UseCase層: Presentation層の型をインポート（NG: 同列レイヤー間の依存）
// src/usecases/user/CreateUserUseCase.ts
import { UserComponentProps } from '@/presentation/types';  // 禁止！
```

**インポートルールまとめ:**

| インポート元（from） | インポート先（to） | 可否 | 理由 |
|------------------|-----------------|-----|------|
| UseCase層 | Domain層 | ✅ 可 | 外→内の依存（正しい方向） |
| Infrastructure層 | Domain層 | ✅ 可 | 外→内の依存（正しい方向） |
| Presentation層 | Domain層 | ✅ 可 | 外→内の依存（正しい方向） |
| Infrastructure層 | UseCase層 | ✅ 可 | 外→内の依存（正しい方向） |
| Presentation層 | UseCase層 | ✅ 可 | 外→内の依存（正しい方向） |
| Presentation層 | Infrastructure層 | ✅ 可 | 外→内の依存（正しい方向） |
| Domain層 | UseCase層 | ❌ 不可 | 内→外の依存（禁止） |
| Domain層 | Infrastructure層 | ❌ 不可 | 内→外の依存（禁止） |
| Domain層 | Presentation層 | ❌ 不可 | 内→外の依存（禁止） |
| UseCase層 | Infrastructure層 | ❌ 不可 | 内→外の依存（禁止） |
| UseCase層 | Presentation層 | ❌ 不可 | 内→外の依存（禁止） |
| Infrastructure層 | Presentation層 | ❌ 不可 | 内→外の依存（禁止） |

**依存関係の図（再掲）:**
```
外側 ↓                      ↓ 内側
┌─────────────────┐
│ Presentation    │ ───┐
└─────────────────┘    │
                       ├──→ 内側への依存は OK
┌─────────────────┐    │
│ Infrastructure  │ ───┤
└─────────────────┘    │
                       │
┌─────────────────┐    │
│ UseCase         │ ───┘
└─────────────────┘
        ↓
┌─────────────────┐
│ Domain          │ ← どのレイヤーにも依存しない（独立）
└─────────────────┘
```

### 実践的な例

#### 例1: Domain層の共通型定義

```typescript
// src/domain/types/common.types.ts

/**
 * 処理結果を表す型（成功/失敗を明示）
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Optional型（値が存在しない可能性を明示）
 */
export type Option<T> = T | null | undefined;

/**
 * ID型（文字列だがIDであることを明示）
 */
export type EntityId = string & { readonly __brand: 'EntityId' };

// src/domain/types/index.ts
export * from './user.types';
export * from './product.types';
export * from './common.types';
```

#### 例2: Domain層の機能固有の型

```typescript
// src/domain/types/user.types.ts

/**
 * ユーザーエンティティ
 */
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ユーザーリポジトリのインターフェース
 * （実装はInfrastructure層）
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

#### 例3: UseCase層の共有型

```typescript
// src/usecases/types/user.types.ts
import { User } from '@/domain/types';

/**
 * ユーザー作成の入力型
 */
export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

/**
 * ユーザー更新の入力型
 */
export interface UpdateUserInput {
  id: string;
  username?: string;
  email?: string;
}

/**
 * ユーザーUseCaseの出力型
 */
export interface UserUseCaseOutput {
  user: User;
  message: string;
}

// src/usecases/types/index.ts
export * from './user.types';
export * from './common.types';
```

#### 例4: UseCase内での型定義（UseCase固有の型）

```typescript
// src/usecases/sync/ExecuteSyncUseCase.ts
import { Result } from '@/domain/types';

// ✅ このUseCaseでのみ使う型はファイル内に定義（エクスポートしない）
type SyncContext = {
  startTime: number;
  itemsProcessed: number;
  errors: Error[];
};

type SyncValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface SyncResult {
  itemsProcessed: number;
  duration: number;
  errors: Error[];
}

export class ExecuteSyncUseCase {
  async execute(): Promise<Result<SyncResult>> {
    const context: SyncContext = {
      startTime: Date.now(),
      itemsProcessed: 0,
      errors: [],
    };

    const validation = this.validate();
    if (!validation.isValid) {
      return { success: false, error: new Error(validation.errors.join(', ')) };
    }

    // ...

    return {
      success: true,
      data: {
        itemsProcessed: context.itemsProcessed,
        duration: Date.now() - context.startTime,
        errors: context.errors,
      },
    };
  }

  private validate(): SyncValidationResult {
    // ...
  }
}
```

#### 例5: Infrastructure層の型定義

```typescript
// src/infrastructure/types/api.types.ts
import { User } from '@/domain/types';

/**
 * APIのユーザーレスポンス型（snake_case）
 */
export interface ApiUserResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * APIレスポンスをDomainエンティティに変換
 */
export function toUserEntity(response: ApiUserResponse): User {
  return {
    id: response.id,
    username: response.username,
    email: response.email,
    createdAt: new Date(response.created_at),
    updatedAt: new Date(response.updated_at),
  };
}

// src/infrastructure/types/storage.types.ts
export interface StorageConfig {
  prefix: string;
  expirationMs: number;
}

export interface StorageData<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

// src/infrastructure/types/index.ts
export * from './api.types';
export * from './storage.types';
export * from './database.types';
```

#### 例6: Presentation層の型定義

```typescript
// src/presentation/types/component.types.ts
import { User } from '@/domain/types';

/**
 * 基底コンポーネントのProps
 */
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

/**
 * ユーザー情報を表示するコンポーネントのProps
 */
export interface UserComponentProps extends BaseComponentProps {
  user: User;
}

// src/presentation/types/event.types.ts
import { User } from '@/domain/types';

export type UserEventHandler = (user: User) => void;
export type UserIdEventHandler = (userId: string) => void;
export type ErrorEventHandler = (error: Error) => void;

// src/presentation/types/index.ts
export * from './component.types';
export * from './view.types';
export * from './event.types';
```

### 注意事項

1. **型の循環参照を避ける**
   - 型ファイル間で相互に依存しないように設計
   - 必要に応じて共通の型ファイルに抽出

2. **ジェネリック型の活用**
   ```typescript
   // ✅ 汎用的な型はジェネリックで定義
   export interface ApiResponse<T> {
     data: T;
     status: number;
     message: string;
   }
   ```

3. **型のエクスポート**
   ```typescript
   // ✅ 外部で使用する型は必ずエクスポート
   export interface User { ... }
   export type UserId = string;

   // ❌ 内部でのみ使う型はエクスポートしない
   type InternalHelper = { ... };
   ```

4. **JSDocコメントの推奨**
   ```typescript
   /**
    * ユーザー情報を表すインターフェース
    * @property id - ユーザーID（UUID形式）
    * @property username - ユーザー名（3-20文字）
    */
   export interface User {
     id: string;
     username: string;
   }
   ```

---

## 📋 開発完了時の必須プロセス

**IMPORTANT**: すべての開発タスク（機能追加、バグ修正、リファクタリング等）が完了した際は、以下のプロセスを**必ず順番通りに実行**してください。各ステップが成功するまで次のステップに進んではいけません。

### ステップ実行順序

1. **カバレッジ測定** → 2. **テストケース作成・充実** → 3. **失敗テストの修正** → 4. **Lint修正** → 5. **Lintエラー・警告の完全解消** → 6. **ビルド実行**

---

## 📊 ステップ1: カバレッジ測定

### 実行コマンド
```bash
npm run test:coverage
```

### 確認項目

1. **全体カバレッジ**の確認（参考値）:
   - Statements: 96%以上
   - Branches: 89%以上
   - Functions: 96%以上
   - Lines: 96%以上

2. **修正したファイルのカバレッジ**を詳細確認:
   - ターミナル出力の`% Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s`テーブルを確認
   - または `coverage/lcov-report/index.html` をブラウザで開いて該当ファイルを確認

### 次ステップへの判断

修正したファイルのカバレッジが**90%未満**の場合 → **ステップ2へ**
修正したファイルのカバレッジが**90%以上**の場合 → **ステップ3へ**

---

## ✅ ステップ2: テストケース作成・充実

### 対象ファイルの特定

カバレッジレポートから以下を特定：
1. 修正したファイルで**Uncovered Line #s**に表示されている行番号
2. カバレッジが90%未満のファイル

### テスト作成の原則

#### 2.1 テストファイルの配置

```
src/
├── domain/entities/MyEntity.ts
│   └── __tests__/MyEntity.test.ts
├── usecases/MyUseCase.ts
│   └── __tests__/MyUseCase.test.ts
├── infrastructure/services/MyService.ts
│   └── __tests__/MyService.test.ts
```

#### 2.2 テストケースの網羅性

各関数・メソッドに対して以下のテストケースを作成：

1. **正常系テスト** (Happy Path):
   - 期待される入力で正しい出力が得られること

2. **異常系テスト** (Error Cases):
   - 不正な入力でエラーが発生すること
   - エラーメッセージが適切であること

3. **境界値テスト** (Edge Cases):
   - 空配列、null、undefined、0、負の数など
   - 最小値・最大値のテスト

4. **分岐網羅** (Branch Coverage):
   - if/else、switch/caseのすべての分岐
   - 三項演算子の両方の結果
   - 論理演算子（&&、||）の短絡評価

#### 2.3 モックの使用

**依存性の完全な隔離:**

```typescript
// 外部依存をモック
jest.mock('@infrastructure/repositories/MyRepository');
jest.mock('@domain/services/Logger');

describe('MyUseCase', () => {
  let useCase: MyUseCase;
  let mockRepository: jest.Mocked<MyRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new MyUseCase(mockRepository, mockLogger);
  });

  it('should handle successful case', async () => {
    mockRepository.load.mockResolvedValue({ data: 'test' });
    const result = await useCase.execute();
    expect(result).toEqual({ data: 'test' });
    expect(mockLogger.info).toHaveBeenCalledWith('Success');
  });
});
```

### 例外: テスト作成が困難なケース

以下の場合はテスト作成を省略可能（ただし理由を明記）：

1. **DOM操作が必要なView層コード** → `@coverage 0%`コメント + jest.config.js除外設定
2. **Chrome API直接操作** → 統合テストでカバー
3. **外部ライブラリの単純なラッパー** → ライブラリ自体がテストされている場合

**例外適用時の手順:**
```typescript
// @coverage 0% - DOM-heavy UI component requiring E2E testing
export class MyView {
  // ...
}
```

```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/path/to/MyView.ts',  // 除外ファイルを追加
],
```

### カバレッジ再測定

テスト追加後、再度カバレッジを測定：
```bash
npm run test:coverage
```

**90%以上になるまでこのステップを繰り返す。**

---

## 🔧 ステップ3: 失敗・スキップテストの修正

### テスト実行

```bash
npm test
```

### 成功基準

- **0 failed**: すべてのテストが合格
- **skipped**: 意図的なskipのみ許容（describe.skip、it.skip with コメント）

### 失敗時の対応フロー

#### パターンA: テストコードのバグ

1. テストコードを修正
2. `npm test` で再実行
3. 合格するまで繰り返す

#### パターンB: 実装コードのバグ

1. 実装コードを修正
2. `npm test` で再実行
3. 失敗がなくなるまで繰り返す

#### パターンC: 仕様変更によるテスト修正

1. 新しい仕様に合わせてテストを更新
2. 期待値（expect）を修正
3. モックの戻り値を調整
4. `npm test` で合格確認

### スキップされたテストの確認

意図的なskipには必ずコメントを記述：

```typescript
describe.skip('Legacy feature - deprecated in v3.0', () => {
  // ...
});

it.skip('TODO: Implement after API v2 migration', () => {
  // ...
});
```

### 繰り返し確認

```bash
npm test
```

**すべてのテストが合格するまで修正を繰り返す。**

---

## 🔍 ステップ4: Lint自動修正

### 実行コマンド
```bash
npm run lint:fix & npm run format
```

### 成功基準
- コマンドが正常終了すること
- 自動修正可能な問題がすべて修正されること

### 注意事項
- Prettierによるフォーマットも同時に実行される（lint-staged経由）
- 自動修正できない問題は次のステップで手動対応

---

## ⚠️ ステップ5: Lintエラー・警告の完全解消

### 実行コマンド
```bash
npm run lint
```

### 成功基準
**0 errors, 0 warnings** であること（`--max-warnings 0`が設定済み）

### 失敗時の対応

#### パターンA: 正当な警告の場合（eslint-disable追加）

eslint-disableコメントを追加する際は、**必ず詳細な理由を記述**してください：

```typescript
// eslint-disable-next-line complexity -- ルール違反の理由を具体的に説明。なぜこの複雑度が必要なのか、リファクタリングが困難な理由は何かを明記。最低20文字以上の説明を推奨。
function complexFunction() {
  // ...
}
```

**よく使用されるルール抑制:**
- `complexity`: 循環的複雑度（最大10）
- `max-params`: パラメータ数（最大4）
- `max-lines-per-function`: 関数の行数（最大50行）
- `max-depth`: ネスト深度（最大4）
- `@typescript-eslint/no-unused-vars`: 未使用変数

#### パターンB: コード修正が必要な場合

以下の優先順位で対応：
1. **リファクタリング**: 可能であればコードを改善
2. **関数分割**: 複雑な関数を小さな関数に分割
3. **パラメータ統合**: オブジェクトにまとめるなど

### 繰り返し確認
```bash
npm run lint
```
0 errors, 0 warnings になるまで繰り返す。

---

## 🏗️ ステップ6: ビルド実行

### 実行コマンド

```bash
npm run build
```

### 成功基準

- ビルドが正常終了すること
- `dist/` ディレクトリに成果物が生成されること
- エラー・警告が0件であること

### 失敗時の対応

#### TypeScriptコンパイルエラー

1. エラーメッセージを確認
2. 型定義を修正
3. `npm run type-check` で事前確認
4. 再度 `npm run build`

#### Webpack設定エラー

1. webpack.config.js を確認
2. 依存関係の問題を解決
3. 再度 `npm run build`

---

## 🎯 完了チェックリスト

すべてのステップが以下の状態になったら開発完了：

- ✅ `npm run test:coverage` → **修正範囲が90%以上**
- ✅ `npm test` → **0 failed, 意図的なskipのみ**
- ✅ `npm run lint` → **0 errors, 0 warnings**
- ✅ `npm run build` → **成功、0 errors**

---

## 🚀 推奨: 統合検証コマンド

すべてのステップを一度に実行する場合：

```bash
npm run hooks:quality-gate  # 完全品質チェック（カバレッジ + テスト + Lint + 型チェック + ビルド）
```

またはカバレッジ重点チェック：

```bash
npm run hooks:coverage  # カバレッジチェック & テスト強化
```

---

## 📝 ユーザーへの報告形式

すべてのステップ完了後、以下の形式で報告してください：

```markdown
## ✅ 品質保証プロセス完了

### 実行結果

1. **カバレッジ**:
   - 修正ファイル: src/path/to/File.ts (96.5% lines)
   - 全体: Statements 96.14%, Branches 89.89%, Functions 96.77%, Lines 96.17%
2. **テスト**: 3607 passed, 0 failed
3. **Lint**: 0 errors, 0 warnings
4. **ビルド**: Success

### 追加したテストケース

- `src/path/to/__tests__/File.test.ts`: 15テストケース追加
  - 正常系: 5ケース
  - 異常系: 7ケース
  - 境界値: 3ケース

### 修正したLint警告

- `src/path/to/File.ts:42`: complexity警告 → eslint-disable追加（理由: 複数の同期方向に対する結果メッセージフォーマット処理のため分岐が必要）

すべての品質基準をクリアしました。
```

---

## ⚡ パフォーマンス最適化のヒント

- **並列実行**: `npm run lint:fix && npm test` のように独立したコマンドは並列実行可能
- **サイレントモード**: 大量の出力を抑制する場合は `npm test -- --silent`
- **特定ファイルのテスト**: `npm test -- path/to/test.test.ts` で高速化
- **ウォッチモード**: 開発中は `npm run test:watch` で自動再実行

---

## 🔄 Git Hooks連携

以下のGit hooksが自動実行されます：

### pre-commit
- `npx lint-staged`: 変更ファイルのLint + Format

### pre-push
- `npm run type-check`: 型チェック
- `npm run complexity`: 複雑度チェック

**注意**: これらは最低限のチェックです。開発完了時は上記の完全なプロセスを手動実行してください。

---

## 📚 参考資料

- **コマンド一覧**: `README.md` の「開発コマンド」セクション
- **アーキテクチャ**: `README.md` の「アーキテクチャ」セクション
- **テスト戦略**: 既存の`__tests__`ディレクトリ内のテストファイルを参考
- **ESLintルール**: `.eslintrc.js`
- **Jest設定**: `jest.config.js`

---

**最終更新日**: 2025-10-23 (Slack通知にプロセスIDプレフィックス追加、装飾を削除 - タスク要約に`[$$]`形式でPIDを含め、ヘッダーと罫線を削除)
