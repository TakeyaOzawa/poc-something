# Windows 11 開発環境 PowerShell自動セットアップ

## 概要

`docs/WINDOWS11_DEVELOPMENT_SETUP.md`の内容をPowerShellスクリプトとして自動実行可能な形式に変換しました。

**対象環境:**
- Windows 11 Home
- AMD Ryzen 7 8845HS (8コア/16スレッド)
- 32GB DDR5-5600メモリ
- Radeon 780M統合GPU

## 📁 スクリプトファイル構成

```
docs/
├── setup-windows11-dev-environment.ps1  # メインセットアップスクリプト
├── setup-wsl2-ubuntu.ps1               # WSL2 + Ubuntu 24.04設定
├── setup-containers.ps1                # 11コンテナ環境構築
├── setup-monitoring.ps1                # リソース監視・最適化
├── POWERSHELL_SCRIPTS_README.md         # この手順書
└── 生成されるファイル/
    ├── amazon-q-cluster.yaml           # Amazon Q Kubernetes設定
    ├── app-stack.yaml                  # アプリケーションスタック設定
    ├── monitor-resources.ps1           # リソース監視スクリプト
    ├── backup-config.ps1               # バックアップスクリプト
    └── daily-maintenance.ps1           # 日次メンテナンススクリプト
```

## 🚀 完全自動実行手順

### 🎯 **ワンライン実行（推奨）**

```powershell
# 管理者権限PowerShellで実行
cd C:\path\to\workspace\docs

# 完全自動セットアップ（Phase 1のみ、再起動必要）
.\setup-windows11-dev-environment.ps1 -Phase1

# 再起動後、残りのフェーズを自動実行
.\setup-wsl2-ubuntu.ps1 -All
.\setup-windows11-dev-environment.ps1 -Phase2
.\setup-windows11-dev-environment.ps1 -Phase3
.\setup-containers.ps1 -All
.\setup-monitoring.ps1 -All
```

### 📋 **段階的実行（詳細制御）**

### ⚠️ 事前準備

1. **管理者権限でPowerShellを起動**
   ```powershell
   # PowerShellを右クリック → "管理者として実行"
   ```

2. **実行ポリシー設定**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **スクリプトディレクトリに移動**
   ```powershell
   cd C:\path\to\workspace\docs
   ```

### 📋 Phase 1: システム基盤セットアップ

```powershell
# 環境確認
.\setup-windows11-dev-environment.ps1 -Check

# Phase 1実行（WSL2有効化、メモリ最適化、Windows Defender設定）
.\setup-windows11-dev-environment.ps1 -Phase1
```

**⚠️ 重要: Phase 1完了後は必ず再起動してください**

### 📋 Phase 2: WSL2 + Ubuntu設定（再起動後）

```powershell
# WSL2 + Ubuntu 24.04の完全セットアップ
.\setup-wsl2-ubuntu.ps1 -All
```

**実行内容:**
- Ubuntu 24.04 LTSインストール
- WSL2設定ファイル作成（16GB、8コア割り当て）
- AMD ROCm 6.2.4設定
- Node.js 22 LTS、Python 3.12、開発ツール
- **SSH鍵生成・Git設定**
- **GitHub接続設定**

**⚠️ 重要: SSH設定時にGitHubのメールアドレスとユーザー名の入力が必要です**

### 📋 Phase 3: パッケージ管理 + Docker/Kubernetes

```powershell
# パッケージ管理システム構築
.\setup-windows11-dev-environment.ps1 -Phase2

# Docker & Kubernetes セットアップ
.\setup-windows11-dev-environment.ps1 -Phase3
```

### 📋 Phase 4: 11コンテナ環境構築

```powershell
# YAML設定ファイル作成 + 全コンテナデプロイ
.\setup-containers.ps1 -All

# 個別実行の場合
.\setup-containers.ps1 -CreateYAML
.\setup-containers.ps1 -DeployAmazonQ
.\setup-containers.ps1 -DeployAppStack
```

### 📋 Phase 5: 監視・最適化・セキュリティ

```powershell
# 監視ツール + システム最適化 + セキュリティ設定
.\setup-monitoring.ps1 -All
```

**実行内容:**
- **監視ツールインストール**: Windows Admin Center、Process Explorer
- **システム最適化**: 電源プラン、不要サービス停止、視覚効果最適化
- **セキュリティ設定**: ファイアウォール、DNS設定（Cloudflare）
- **スクリプト作成**: バックアップ・メンテナンススクリプト自動生成
- **自動監視**: タスクスケジューラー登録（5分間隔）

## 🔍 完全環境確認

### 全体確認（推奨）
```powershell
# 完全な環境確認スクリプト実行
.\setup-monitoring.ps1 -ShowStatus

# 個別確認
.\setup-windows11-dev-environment.ps1 -Check  # システム基盤
.\setup-containers.ps1 -Status                # コンテナ状態
```

### 詳細確認
```powershell
# AMD GPU・ROCm確認
wsl -d Ubuntu-24.04 -e rocm-smi
wsl -d Ubuntu-24.04 -e rocminfo
wsl -d Ubuntu-24.04 -e python3 -c "import torch; print(f'ROCm: {torch.cuda.is_available()}')"

# NPU・AI Platform確認
Get-WindowsCapability -Online | Where-Object Name -like "*AI*"
Get-WmiObject -Class Win32_PnPEntity | Where-Object {$_.Name -like "*NPU*"}

# コンテナ内AMD GPU確認
kubectl exec -n amazon-q deployment/amazon-q-chat -- rocm-smi
kubectl exec -n amazon-q deployment/amazon-q-code -- hipconfig --version
```

### 個別確認
```powershell
# WSL2状態
wsl --status
wsl -l -v

# Docker状態
docker --version
docker info

# Kubernetes状態
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces

# minikube状態
minikube status
```

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### 1. WSL2インストール失敗
```powershell
# Windows機能確認
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# 手動有効化
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

#### 2. Docker Desktop起動失敗
```powershell
# Docker Desktop再起動
Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
Start-Process "Docker Desktop"

# WSL2統合確認
wsl --shutdown
Start-Sleep 5
```

#### 3. minikube起動失敗
```powershell
# minikube削除・再作成
minikube delete
minikube start --kubernetes-version=v1.28.0 --driver=docker
```

#### 4. コンテナデプロイ失敗
```powershell
# 全コンテナクリーンアップ
.\setup-containers.ps1 -Cleanup

# 再デプロイ
.\setup-containers.ps1 -All
```

### ログファイル確認

各スクリプト実行時に詳細ログが生成されます：

```powershell
# ログファイル例
setup-log-20241108-143022.txt
wsl2-setup-log-20241108-143022.txt
containers-setup-log-20241108-143022.txt
monitoring-setup-log-20241108-143022.txt
```

## 📊 リソース配分（32GB環境）

| コンポーネント | CPU | メモリ | 備考 |
|---|---|---|---|
| Windows 11 Home | 2コア | 6GB | OS基本 + 軽量監視 |
| WSL2 (Ubuntu 24.04) | 8コア | 16GB | 開発環境 + ROCm |
| Docker Desktop | - | 12GB | コンテナ実行環境 |
| Amazon Q × 4 | 4コア | 8GB | AI推論最適化 |
| App Stack × 7 | 2コア | 4GB | 軽量設定 |
| **合計** | **16スレッド** | **32GB** | **統合APU最適化** |

## 🔧 AMD Ryzen 7 8845HS最適化設定

### 自動適用される最適化

1. **メモリ最適化**
   - ページファイル: 16GB固定
   - Large Page Support有効化
   - メモリプリフェッチ最適化
   - メモリ圧縮無効化（32GB環境では不要）

2. **CPU最適化**
   - 高パフォーマンス電源プラン
   - AMD Ryzen用NUMA最適化
   - OMP_NUM_THREADS=16設定

3. **GPU/NPU最適化**
   - AMD ROCm 6.2.4設定
   - Radeon 780M統合GPU対応
   - NPU 16TOPS活用設定
   - PyTorch ROCm統合

4. **セキュリティ最適化**
   - Windows Defender除外設定
   - 開発効率重視の設定

## 🔄 定期メンテナンス

### 日次メンテナンス（自動化）
```powershell
# 監視タスクが自動実行（5分間隔）
# - CPU使用率監視（閾値: 80%）
# - メモリ使用率監視（閾値: 85%）
# - ディスク使用率監視（閾値: 90%）
# - コンテナリソース監視
```

### 週次メンテナンス（手動）
```powershell
# パッケージ更新
winget upgrade --all
choco upgrade all -y

# Docker クリーンアップ
docker system prune -f
docker volume prune -f

# Kubernetes Pod再起動
kubectl rollout restart deployment -n amazon-q
kubectl rollout restart deployment -n app-stack
```

## 🚨 緊急時対応

### 全サービス停止
```powershell
# 緊急停止
kubectl delete --all deployments --all-namespaces
minikube stop
docker stop $(docker ps -aq)
```

### 設定リセット
```powershell
# 完全リセット
.\setup-containers.ps1 -Cleanup
minikube delete
docker system prune -af --volumes

# 再セットアップ
.\setup-containers.ps1 -All
```

## 📞 サポート情報

### 環境変数設定（オプション）
```powershell
# Slack通知（オプション）
[Environment]::SetEnvironmentVariable("SLACK_OAUTH_TOKEN", "xoxb-your-token", "User")

# Notion統合（オプション）
[Environment]::SetEnvironmentVariable("NOTION_API_KEY", "secret_your-key", "User")
[Environment]::SetEnvironmentVariable("NOTION_DATABASE_ID", "your-database-id", "User")
```

### パフォーマンス確認
```powershell
# システムパフォーマンス
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\Available MBytes"

# AMD GPU確認
wsl -d Ubuntu-24.04 -e rocm-smi

# NPU確認（Windows AI Platform）
Get-WindowsCapability -Online | Where-Object Name -like "*AI*"
```

---

**作成日**: 2024-11-08  
**バージョン**: 1.0  
**対象**: Windows 11 Home + AMD Ryzen 7 8845HS (32GB RAM)

**注意事項:**
- 各スクリプトは管理者権限で実行してください
- Phase 1完了後は必ず再起動してください
- ログファイルでエラー詳細を確認してください
- AMD固有の最適化設定が含まれています
