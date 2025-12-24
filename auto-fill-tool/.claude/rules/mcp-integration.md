---
inclusion: fileMatch
fileMatchPattern: '**/.kiro/settings/mcp.json'
---

# MCP統合ガイド

## 🔧 MCP (Model Context Protocol) 設定

このプロジェクトでは、外部システムとの連携を強化するためにMCPサーバーを活用しています。

## 📋 設定済みMCPサーバー

### 🌐 Chrome拡張機能開発支援

#### chrome サーバー
```json
{
  "command": "uvx",
  "args": ["mcp-server-chrome@latest"],
  "disabled": false,
  "autoApprove": [
    "chrome_list_tabs",
    "chrome_get_tab_info", 
    "chrome_navigate_tab",
    "chrome_execute_script",
    "chrome_get_extension_info",
    "chrome_reload_extension"
  ]
}
```

**主な機能**:
- **タブ管理**: 開いているタブの一覧取得・操作
- **スクリプト実行**: 任意のJavaScriptコードの実行
- **拡張機能管理**: 拡張機能の情報取得・リロード
- **ナビゲーション**: 特定URLへの移動

**使用例**:
```typescript
// 拡張機能の開発・テスト時
// 1. 拡張機能をリロード
await chrome_reload_extension();

// 2. テストページに移動
await chrome_navigate_tab("https://example.com");

// 3. 自動入力のテスト実行
await chrome_execute_script({
  code: `
    document.querySelector('#username').value = 'test';
    document.querySelector('#password').value = 'password';
  `
});
```

### ☁️ AWS連携

#### aws-docs サーバー
```json
{
  "command": "uvx",
  "args": ["awslabs.aws-documentation-mcp-server@latest"],
  "disabled": false,
  "autoApprove": [
    "search_aws_docs",
    "get_aws_service_info",
    "list_aws_services"
  ]
}
```

**主な機能**:
- **ドキュメント検索**: AWS公式ドキュメントの検索
- **サービス情報**: 各AWSサービスの詳細情報取得
- **サービス一覧**: 利用可能なAWSサービスの一覧

**使用例**:
```typescript
// Chrome拡張機能のクラウド展開を検討する際
// 1. Chrome Extension関連のAWSサービス検索
await search_aws_docs("chrome extension serverless");

// 2. Lambda関数の詳細情報取得
await get_aws_service_info("lambda");

// 3. S3での静的ホスティング情報
await search_aws_docs("s3 static website hosting");
```

#### aws-cli サーバー（読み取り専用で有効化）
```json
{
  "command": "uvx", 
  "args": ["mcp-server-aws-cli@latest"],
  "disabled": false,
  "env": {
    "AWS_PROFILE": "${KIRO_AWS_PROFILE}",
    "AWS_REGION": "${KIRO_AWS_REGION}"
  },
  "autoApprove": [
    "aws_s3_list_buckets",
    "aws_s3_list_objects", 
    "aws_s3_get_object_info",
    "aws_lambda_list_functions",
    "aws_lambda_get_function",
    "aws_ec2_describe_instances",
    "aws_ec2_describe_security_groups",
    "aws_iam_list_users",
    "aws_iam_list_roles"
  ]
}
```

**主な機能（読み取り専用）**:
- **S3参照**: バケット一覧・オブジェクト情報取得
- **Lambda参照**: 関数一覧・設定確認
- **EC2参照**: インスタンス・セキュリティグループ・VPC情報
- **IAM参照**: ユーザー・ロール一覧
- **CloudFormation参照**: スタック情報確認
- **RDS/Aurora参照**: データベースインスタンス・クラスター情報
- **CodeBuild参照**: ビルドプロジェクト・実行履歴確認
- **ECR参照**: コンテナリポジトリ・イメージ一覧
- **ECS参照**: クラスター・サービス・タスク情報
- **EventBridge参照**: イベントルール・バス情報
- **API Gateway参照**: REST API・HTTP API・リソース情報
- **Step Functions参照**: ステートマシン・実行履歴
- **VPC参照**: VPC・サブネット・ルートテーブル・ゲートウェイ情報
- **Secrets Manager参照**: シークレット一覧・メタデータ
- **Systems Manager参照**: パラメータ・インスタンス情報
- **SES参照**: 送信者ID・設定セット情報
- **Well-Architected Tool参照**: ワークロード・レンズレビュー情報
- **Cost Explorer参照**: コスト・使用量分析・予測
- **Budgets参照**: 予算設定・パフォーマンス履歴
- **Cost and Usage Reports参照**: 詳細な請求レポート定義
- **Pricing参照**: AWSサービス料金情報

**セキュリティ制限**:
- **書き込み操作**: 手動承認必須（`aws_s3_put_object`, `aws_lambda_update_function`等）
- **削除操作**: 手動承認必須（`aws_s3_delete_object`, `aws_ec2_terminate_instances`等）
- **作成操作**: 手動承認必須（`aws_s3_create_bucket`, `aws_lambda_create_function`等）

### 🔧 開発ツール

#### filesystem サーバー
- **ファイル操作**: `read_file`, `list_directory`, `search_files`
- **プロジェクト探索**: ソースコード検索・分析

#### git サーバー  
- **Git操作**: `git_status`, `git_diff`, `git_log`, `git_show`
- **バージョン管理**: コミット履歴・差分確認

### 📝 ドキュメント・コミュニケーション

#### notion サーバー
- **Notion連携**: `notion_search`, `notion_read_page`, `notion_list_databases`
- **ドキュメント管理**: 仕様書・設計書の管理

#### slack サーバー
- **Slack連携**: `list_channels`, `send_message`, `get_channel_history`
- **チーム通知**: 開発状況の共有

## 🚀 Chrome拡張機能開発での活用シナリオ

### シナリオ1: 拡張機能のデバッグ

```typescript
// 1. 現在の拡張機能情報を確認
const extensionInfo = await chrome_get_extension_info();
console.log('Extension ID:', extensionInfo.id);

// 2. 拡張機能をリロード（コード変更後）
await chrome_reload_extension();

// 3. テストページを開く
await chrome_navigate_tab("https://test-site.com/login");

// 4. 自動入力をテスト
await chrome_execute_script({
  code: `
    // XPath管理画面で設定したロジックをテスト
    const usernameField = document.evaluate(
      "//input[@type='text']", 
      document, 
      null, 
      XPathResult.FIRST_ORDERED_NODE_TYPE, 
      null
    ).singleNodeValue;
    
    if (usernameField) {
      usernameField.value = 'test-user';
      console.log('Username field filled successfully');
    }
  `
});
```

### シナリオ2: パフォーマンス監視

```typescript
// 1. 複数タブでの拡張機能動作確認
const tabs = await chrome_list_tabs();
console.log('Active tabs:', tabs.length);

// 2. 各タブでメモリ使用量チェック
for (const tab of tabs) {
  await chrome_execute_script({
    tabId: tab.id,
    code: `
      console.log('Memory usage:', performance.memory);
      console.log('Extension performance:', chrome.runtime);
    `
  });
}
```

### シナリオ3: AWS環境の包括的調査・監視

```typescript
// 1. Chrome拡張機能のCI/CDパイプライン確認
const codeBuildProjects = await aws_codebuild_list_projects();
const buildDetails = await aws_codebuild_batch_get_projects({
  names: ['auto-fill-extension-build']
});
console.log('Build projects:', buildDetails);

// 2. コンテナイメージの管理状況確認
const ecrRepositories = await aws_ecr_describe_repositories();
const containerImages = await aws_ecr_list_images({
  repositoryName: 'auto-fill-extension'
});
console.log('Container images:', containerImages);

// 3. ECSでのマイクロサービス確認
const ecsClusters = await aws_ecs_list_clusters();
const ecsServices = await aws_ecs_list_services({
  cluster: 'auto-fill-cluster'
});
const taskDefinitions = await aws_ecs_list_task_definitions();
console.log('ECS services:', ecsServices);

// 4. API Gatewayエンドポイント確認
const restApis = await aws_apigateway_get_rest_apis();
const httpApis = await aws_apigatewayv2_get_apis();
console.log('API endpoints:', { restApis, httpApis });

// 5. Aurora/RDSデータベース状況
const dbClusters = await aws_rds_describe_db_clusters();
const dbInstances = await aws_rds_describe_db_instances();
console.log('Database clusters:', dbClusters);
```

### シナリオ4: イベント駆動アーキテクチャの監視

```typescript
// 1. EventBridgeルールとイベントバス確認
const eventRules = await aws_events_list_rules();
const eventBuses = await aws_events_list_event_buses();
console.log('Event-driven architecture:', { eventRules, eventBuses });

// 2. Step Functionsワークフロー確認
const stateMachines = await aws_stepfunctions_list_state_machines();
const executions = await aws_stepfunctions_list_executions({
  stateMachineArn: 'arn:aws:states:region:account:stateMachine:auto-fill-workflow'
});
console.log('Workflow executions:', executions);

// 3. VPCネットワーク構成確認
const vpcs = await aws_ec2_describe_vpcs();
const subnets = await aws_ec2_describe_subnets();
const routeTables = await aws_ec2_describe_route_tables();
const internetGateways = await aws_ec2_describe_internet_gateways();
console.log('Network topology:', { vpcs, subnets, routeTables });
```

### シナリオ5: セキュリティ・設定管理の確認

```typescript
// 1. Secrets Managerでの機密情報管理確認
const secrets = await aws_secretsmanager_list_secrets();
const secretDetails = await aws_secretsmanager_describe_secret({
  secretId: 'auto-fill-extension/api-keys'
});
console.log('Managed secrets:', secrets);

// 2. Systems Managerパラメータ確認
const parameters = await aws_ssm_describe_parameters();
const configParam = await aws_ssm_get_parameter({
  name: '/auto-fill/config/environment'
});
console.log('Configuration parameters:', parameters);

// 3. SESメール送信設定確認
const sesIdentities = await aws_ses_list_identities();
const verificationStatus = await aws_ses_get_identity_verification_attributes({
  identities: sesIdentities
});
console.log('Email sending setup:', verificationStatus);

// 4. Well-Architected Toolでのアーキテクチャ評価
const workloads = await aws_wellarchitected_list_workloads();
const workloadDetails = await aws_wellarchitected_get_workload({
  workloadId: 'auto-fill-extension-workload'
});
const lensReviews = await aws_wellarchitected_list_lens_reviews({
  workloadId: 'auto-fill-extension-workload'
});
console.log('Architecture assessment:', { workloadDetails, lensReviews });
```

### シナリオ6: コスト管理・請求監視

```typescript
// 1. 月次コスト・使用量の確認
const costAndUsage = await aws_ce_get_cost_and_usage({
  timePeriod: {
    start: '2024-12-01',
    end: '2024-12-31'
  },
  granularity: 'DAILY',
  metrics: ['BlendedCost', 'UsageQuantity'],
  groupBy: [
    {
      type: 'DIMENSION',
      key: 'SERVICE'
    }
  ]
});
console.log('Monthly cost breakdown:', costAndUsage);

// 2. 来月のコスト予測
const costForecast = await aws_ce_get_usage_forecast({
  timePeriod: {
    start: '2025-01-01',
    end: '2025-01-31'
  },
  metric: 'BLENDED_COST',
  granularity: 'MONTHLY'
});
console.log('Cost forecast:', costForecast);

// 3. 予算の確認
const budgets = await aws_budgets_describe_budgets({
  accountId: 'your-account-id'
});
const budgetDetails = await aws_budgets_describe_budget({
  accountId: 'your-account-id',
  budgetName: 'auto-fill-extension-budget'
});
console.log('Budget status:', { budgets, budgetDetails });

// 4. リザーブドインスタンスの使用率確認
const reservationUtilization = await aws_ce_get_reservation_utilization({
  timePeriod: {
    start: '2024-12-01',
    end: '2024-12-31'
  },
  granularity: 'MONTHLY'
});
console.log('Reserved instance utilization:', reservationUtilization);

// 5. Savings Plansの使用率確認
const savingsUtilization = await aws_ce_get_savings_utilization({
  timePeriod: {
    start: '2024-12-01',
    end: '2024-12-31'
  },
  granularity: 'MONTHLY'
});
console.log('Savings Plans utilization:', savingsUtilization);

// 6. コストカテゴリの確認
const costCategories = await aws_ce_list_cost_category_definitions();
console.log('Cost categories:', costCategories);

// 7. Cost and Usage Reportの設定確認
const curReports = await aws_cur_describe_report_definitions();
console.log('Cost and Usage Reports:', curReports);

// 8. 料金情報の確認
const pricingServices = await aws_pricing_describe_services();
const ec2Pricing = await aws_pricing_get_products({
  serviceCode: 'AmazonEC2',
  filters: [
    {
      type: 'TERM_MATCH',
      field: 'instanceType',
      value: 't3.micro'
    }
  ]
});
console.log('Pricing information:', { pricingServices, ec2Pricing });
```

### シナリオ4: インフラ状況の監視

```typescript
// 1. CloudFormationスタックの状態確認
const cfStacks = await aws_cloudformation_list_stacks();
console.log('Infrastructure stacks:', cfStacks);

// 2. ログの確認
const logGroups = await aws_logs_describe_log_groups();
console.log('Available log groups:', logGroups);

// 3. データベース状況の確認
const rdsInstances = await aws_rds_describe_db_instances();
console.log('Database instances:', rdsInstances);
```

## 🔧 環境変数設定

### 必須設定
```bash
# Slack通知（既存のslackNotification.shと連携）
export KIRO_SLACK_BOT_TOKEN='xoxb-your-bot-token'
export KIRO_SLACK_USER_TOKEN='xoxp-your-user-token'

# Notion連携（データ同期機能と連携）
export KIRO_NOTION_TOKEN='your-notion-token'
```

### オプション設定
```bash
# AWS連携（必要時のみ）
export KIRO_AWS_PROFILE='default'
export KIRO_AWS_REGION='ap-northeast-1'

# GitHub連携（必要時のみ）
export KIRO_GITHUB_TOKEN='your-github-token'

# Web検索（必要時のみ）
export KIRO_BRAVE_API_KEY='your-brave-api-key'

# PostgreSQL（必要時のみ）
export KIRO_POSTGRES_URL='postgresql://user:pass@host:port/db'
```

## 📊 MCPサーバー管理

### 有効化・無効化

```json
{
  "mcpServers": {
    "chrome": {
      "disabled": false  // 有効
    },
    "aws-cli": {
      "disabled": true   // 無効（セキュリティ上の理由）
    }
  }
}
```

### 自動承認設定

```json
{
  "autoApprove": [
    "chrome_list_tabs",      // 読み取り専用操作
    "chrome_get_tab_info"    // 情報取得のみ
  ]
  // chrome_execute_script は含めない（手動承認が必要）
}
```

## 🔒 セキュリティ考慮事項

### 1. 自動承認の制限
- **読み取り専用操作**: 自動承認OK
- **書き込み・実行操作**: 手動承認必須
- **機密情報アクセス**: 手動承認必須

### 2. 環境変数の管理
- **機密情報**: 環境変数で管理（`.env`ファイル使用禁止）
- **トークンローテーション**: 定期的な更新
- **最小権限**: 必要最小限の権限のみ付与

### 3. 無効化されたサーバー
- **web-search**: 外部API使用量制限のため無効化
- **github**: プライベートリポジトリアクセスのため無効化
- **postgres**: 本番データベースアクセスのリスクを避けるため無効化

### 4. 読み取り専用サーバー
- **aws-cli**: 参照操作のみ自動承認、変更操作は手動承認必須
  - ✅ 自動承認: `list_*`, `describe_*`, `get_*`
  - ⚠️ 手動承認: `create_*`, `update_*`, `delete_*`, `put_*`

## 🎯 ベストプラクティス

### 1. 開発フロー
```bash
# 1. 拡張機能の変更
npm run build:dev

# 2. MCPでリロード
chrome_reload_extension()

# 3. 自動テスト実行
chrome_execute_script(testCode)

# 4. 結果確認
chrome_get_tab_info()
```

### 2. デバッグ支援
- **Chrome MCP**: リアルタイムデバッグ
- **Git MCP**: 変更履歴の確認
- **Slack MCP**: チーム共有

### 3. ドキュメント連携
- **Notion MCP**: 仕様書の参照・更新
- **AWS Docs MCP**: 技術調査・アーキテクチャ検討

## 🔄 継続的改善

### MCPサーバーの追加検討
- **Chrome DevTools Protocol**: より詳細なデバッグ
- **Playwright**: E2Eテスト自動化
- **Docker**: 開発環境の統一

### 監視・ログ
- MCP操作のログ収集
- パフォーマンス監視
- エラー追跡・分析
