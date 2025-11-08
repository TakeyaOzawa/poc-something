# Windows 11 開発基盤環境構築手順書

## 概要

Windows 11（32GBメモリ）でKubernetes + 11コンテナ環境を効率的に構築・運用するための包括的な手順書です。

**対象環境:**
- Windows 11 Home（Hyper-V代替: WSL2 + Docker Desktop）
- CPU: AMD Ryzen 7 8845HS（8コア/16スレッド、最大5.1GHz）
- メモリ: 32GB
- ストレージ: SSD 500GB以上推奨

**構築対象:**
- Kubernetes クラスター
- Amazon Q コンテナ × 4
- アプリケーションスタック × 7（MySQL, PHP Backend, Nginx, Redis, Queue Worker, Frontend, Fluentd）

---

## Phase 1: システム基盤セットアップ

### 1.1 Windows 11 最適化

#### システム設定
```powershell
# PowerShell管理者権限で実行

# WSL2有効化（Windows 11 Home対応）
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 注意: Windows 11 HomeはHyper-Vが利用不可
# Docker DesktopのWSL2バックエンドを使用してKubernetesを実行

# 再起動
Restart-Computer
```

#### メモリ最適化
```powershell
# 仮想メモリ設定（32GB環境）
$cs = Get-WmiObject -Class Win32_ComputerSystem
$cs.AutomaticManagedPagefile = $false
$cs.Put()

# ページファイルサイズ設定（16GB固定）
wmic pagefileset where name="C:\\pagefile.sys" set InitialSize=16384,MaximumSize=16384
```

#### WSL2設定
```ini
# %USERPROFILE%\.wslconfig
[wsl2]
memory=16GB
processors=8
swap=4GB
localhostForwarding=true
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1

# Ryzen 7 8845HS最適化設定
nestedVirtualization=true
vmIdleTimeout=60000
```

### 1.2 セキュリティ設定

#### Windows Defender最適化
```powershell
# 除外設定
Add-MpPreference -ExclusionPath "C:\workspace"
Add-MpPreference -ExclusionPath "C:\Users\$env:USERNAME\.docker"
Add-MpPreference -ExclusionPath "C:\Users\$env:USERNAME\.kube"
Add-MpPreference -ExclusionPath "C:\ProgramData\Docker"

# プロセス除外
Add-MpPreference -ExclusionProcess "docker.exe"
Add-MpPreference -ExclusionProcess "dockerd.exe"
Add-MpPreference -ExclusionProcess "kubectl.exe"
Add-MpPreference -ExclusionProcess "minikube.exe"

# スクリプトスキャン無効化（開発効率向上）
Set-MpPreference -DisableScriptScanning $true
```

---

## Phase 2: パッケージ管理システム構築

### 2.1 winget + Chocolatey セットアップ

#### winget更新
```powershell
# winget最新化
winget source update
winget upgrade Microsoft.AppInstaller
```

#### Chocolatey インストール
```powershell
# 実行ポリシー設定
Set-ExecutionPolicy Bypass -Scope Process -Force

# Chocolateyインストール
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# セキュリティ設定
choco feature enable -n checksumFiles
choco feature enable -n allowGlobalConfirmation
```

### 2.2 基本ツールインストール

#### 必須ツール（winget）
```powershell
# 基本開発ツール
winget install Microsoft.VisualStudioCode
winget install Git.Git
winget install Microsoft.WindowsTerminal
winget install Microsoft.PowerShell
winget install Docker.DockerDesktop
winget install 7zip.7zip
winget install Mozilla.Firefox

# コミュニケーション・ドキュメント
winget install SlackTechnologies.Slack
winget install Notion.Notion

# システムツール
winget install Microsoft.Sysinternals.ProcessExplorer
winget install Microsoft.Sysinternals.ProcessMonitor
```

#### 開発ツール（Chocolatey）
```powershell
# コンテナ・Kubernetes
choco install kubernetes-cli kubernetes-helm minikube

# 言語ランタイム
choco install nodejs python3 golang

# AWS・クラウドツール
choco install awscli terraform azure-cli

# Git・SSH設定
choco install openssh git

# ユーティリティ
choco install jq yq ripgrep fd make cmake
choco install gh curl wget
```

**🔐 SSH鍵設定（GitHub接続用）:**
```powershell
# SSH鍵生成
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519

# SSH Agent起動・鍵追加
Start-Service ssh-agent
Set-Service -Name ssh-agent -StartupType Automatic
ssh-add ~/.ssh/id_ed25519

# 公開鍵をクリップボードにコピー
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# GitHub設定
# 1. GitHub > Settings > SSH and GPG keys
# 2. "New SSH key"をクリック
# 3. Title: "Windows-DevEnv"
# 4. Key: クリップボードの内容を貼り付け
# 5. "Add SSH key"をクリック

# 接続テスト
ssh -T git@github.com

# Git設定
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

### 2.3 パッケージ管理自動化

#### setup-packages.ps1
```powershell
# パッケージ一括セットアップスクリプト
param(
    [switch]$Essential,
    [switch]$Development,
    [switch]$Kubernetes
)

function Install-WingetPackages {
    $packages = @(
        "Microsoft.VisualStudioCode",
        "Git.Git",
        "Microsoft.WindowsTerminal",
        "Docker.DockerDesktop"
    )
    
    foreach ($package in $packages) {
        Write-Host "Installing $package..." -ForegroundColor Green
        winget install $package --silent --accept-package-agreements
    }
}

function Install-ChocoPackages {
    $packages = @(
        "kubernetes-cli",
        "kubernetes-helm", 
        "minikube",
        "nodejs",
        "awscli"
    )
    
    choco install $packages -y
}

if ($Essential) { Install-WingetPackages }
if ($Development) { Install-ChocoPackages }

Write-Host "Package installation completed!" -ForegroundColor Yellow
```

---

## Phase 3: Docker & Kubernetes セットアップ

### 3.1 Docker Desktop 設定

#### リソース配分
```json
// %APPDATA%\Docker\settings.json
{
  "memoryMiB": 12288,
  "cpus": 8,
  "diskSizeMiB": 102400,
  "swapMiB": 2048,
  "kubernetesEnabled": true,
  "kubernetesInitialInstallPerformed": true,
  "wslEngineEnabled": true,
  "useWindowsContainers": false,
  "exposeDockerAPIOnTcp2375": false,
  "useVirtualizationFramework": true
}
```

**🎯 GPU・NPU統合設定:**
```powershell
# Docker Desktop GPU パススルー設定
# WSL2でのGPU利用有効化
wsl --update
wsl --install Ubuntu-22.04

# WSL2内でのGPU確認
wsl -d Ubuntu-22.04 -e nvidia-smi  # NVIDIA GPUの場合
wsl -d Ubuntu-22.04 -e rocm-smi    # AMD GPUの場合（ROCm）

# AMD ROCm for Radeon 780M（実験的サポート）
# WSL2 Ubuntu内でROCmインストール
wsl -d Ubuntu-22.04 -e bash -c "
curl -fsSL https://repo.radeon.com/rocm/rocm.gpg.key | sudo apt-key add -
echo 'deb [arch=amd64] https://repo.radeon.com/rocm/apt/debian/ ubuntu main' | sudo tee /etc/apt/sources.list.d/rocm.list
sudo apt update && sudo apt install rocm-dev -y
"
```

#### Docker Compose最適化
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  mysql:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
  
  redis:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.25'
```

### 3.2 Kubernetes クラスター構築

#### minikube セットアップ
```powershell
# minikube設定（Ryzen 7 8845HS + 32GB環境用）
minikube config set memory 10240
minikube config set cpus 6
minikube config set disk-size 40g
minikube config set driver docker

# Windows 11 Home用の追加設定
minikube config set container-runtime containerd
minikube config set feature-gates="EphemeralContainers=true"

# クラスター起動
minikube start --kubernetes-version=v1.28.0 --extra-config=kubelet.housekeeping-interval=10s
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```

#### kubectl設定
```powershell
# kubectl補完設定
kubectl completion powershell | Out-String | Invoke-Expression

# エイリアス設定
Set-Alias k kubectl
```

---

## Phase 4: 11コンテナ環境構築

### 4.1 Amazon Q コンテナ × 4

#### amazon-q-cluster.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: amazon-q
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amazon-q-chat
  namespace: amazon-q
spec:
  replicas: 2
  selector:
    matchLabels:
      app: amazon-q-chat
  template:
    metadata:
      labels:
        app: amazon-q-chat
    spec:
      containers:
      - name: amazon-q-chat
        image: amazon/q-developer:latest
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        env:
        - name: Q_SERVICE_TYPE
          value: "chat"
        # NPU・GPU利用設定
        - name: ONNXRUNTIME_PROVIDERS
          value: "DmlExecutionProvider,CPUExecutionProvider"
        - name: USE_NPU_ACCELERATION
          value: "true"
        - name: AMD_GPU_TARGETS
          value: "gfx1103"  # Radeon 780M対応
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amazon-q-code
  namespace: amazon-q
spec:
  replicas: 2
  selector:
    matchLabels:
      app: amazon-q-code
  template:
    metadata:
      labels:
        app: amazon-q-code
    spec:
      containers:
      - name: amazon-q-code
        image: amazon/q-developer:latest
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        env:
        - name: Q_SERVICE_TYPE
          value: "code"
        # AI推論最適化
        - name: INFERENCE_DEVICE
          value: "npu,gpu,cpu"  # 優先順位付き
        - name: MODEL_PRECISION
          value: "fp16"  # NPU効率化
```

### 4.2 アプリケーションスタック × 7

#### app-stack.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: app-stack
---
# MySQL
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: app-stack
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "rootpassword"
        - name: MYSQL_DATABASE
          value: "appdb"
---
# Redis
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: app-stack
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
# PHP Backend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-backend
  namespace: app-stack
spec:
  replicas: 2
  selector:
    matchLabels:
      app: php-backend
  template:
    metadata:
      labels:
        app: php-backend
    spec:
      containers:
      - name: php-backend
        image: php:8.2-fpm-alpine
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"
---
# Nginx
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: app-stack
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
---
# Queue Worker
apiVersion: apps/v1
kind: Deployment
metadata:
  name: queue-worker
  namespace: app-stack
spec:
  replicas: 2
  selector:
    matchLabels:
      app: queue-worker
  template:
    metadata:
      labels:
        app: queue-worker
    spec:
      containers:
      - name: queue-worker
        image: php:8.2-cli-alpine
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
# Frontend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: app-stack
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: node:18-alpine
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"
---
# Fluentd
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fluentd
  namespace: app-stack
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v1.16-debian-1
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

---

## Phase 5: リソース監視・最適化

### 5.1 軽量監視システム（Microsoft純正）

**🔍 監視対象:**
- **システムリソース**: CPU、メモリ、ディスク使用率
- **コンテナメトリクス**: Docker Desktop内蔵監視
- **アプリケーション**: PowerShell監視スクリプト
- **ネットワーク**: Windows Performance Monitor
- **セキュリティ**: Windows Event Log

#### 軽量監視スタック
```powershell
# Windows Performance Monitor設定
# 1. カスタムデータコレクターセット作成
$counterSet = @(
    "\Processor(_Total)\% Processor Time",
    "\Memory\Available MBytes",
    "\LogicalDisk(_Total)\% Disk Time",
    "\Network Interface(*)\Bytes Total/sec"
)

# 2. 監視スクリプト作成
# monitor-system.ps1
function Get-SystemMetrics {
    $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $memory = Get-Counter "\Memory\Available MBytes" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $disk = Get-Counter "\LogicalDisk(_Total)\% Disk Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    
    Write-Host "=== System Metrics ===" -ForegroundColor Yellow
    Write-Host "CPU Usage: $([math]::Round($cpu, 2))%" -ForegroundColor $(if($cpu -gt 80) {"Red"} else {"Green"})
    Write-Host "Available Memory: $([math]::Round($memory/1024, 2)) GB" -ForegroundColor Green
    Write-Host "Disk Usage: $([math]::Round($disk, 2))%" -ForegroundColor $(if($disk -gt 80) {"Red"} else {"Green"})
}

# 3. Docker監視
function Get-DockerMetrics {
    Write-Host "=== Docker Containers ===" -ForegroundColor Yellow
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# 4. Kubernetes監視
function Get-KubernetesMetrics {
    Write-Host "=== Kubernetes Resources ===" -ForegroundColor Yellow
    kubectl top nodes 2>$null
    kubectl top pods --all-namespaces 2>$null
}

# 実行
Get-SystemMetrics
Get-DockerMetrics  
Get-KubernetesMetrics
```

#### Windows Admin Center（推奨）
```powershell
# Microsoft製の軽量管理ツール
winget install Microsoft.WindowsAdminCenter

# 特徴:
# ✅ 無料（Microsoft製）
# ✅ 軽量（ブラウザベース）
# ✅ 自動更新（Windows Update経由）
# ✅ セキュリティ保証（Microsoft）
# ✅ Docker・Hyper-V統合監視
```

### 5.2 監視通知システム

#### Windows標準通知
```powershell
# 1. Windows Toast通知
Add-Type -AssemblyName System.Windows.Forms
function Send-WindowsNotification {
    param(
        [string]$Title = "System Monitor",
        [string]$Message,
        [string]$Icon = "Info"  # Info, Warning, Error
    )
    
    # バルーン通知
    $balloon = New-Object System.Windows.Forms.NotifyIcon
    $balloon.Icon = [System.Drawing.SystemIcons]::Information
    $balloon.BalloonTipTitle = $Title
    $balloon.BalloonTipText = $Message
    $balloon.BalloonTipIcon = $Icon
    $balloon.Visible = $true
    $balloon.ShowBalloonTip(5000)
    
    Start-Sleep -Seconds 1
    $balloon.Dispose()
}

# 使用例
Send-WindowsNotification -Title "CPU Alert" -Message "CPU usage exceeded 80%" -Icon "Warning"
```

#### イベントログ統合通知
```powershell
# 2. Windows Event Log + 通知
function Write-MonitoringEvent {
    param(
        [string]$Source = "DevEnvironment",
        [int]$EventId = 1001,
        [string]$Message,
        [string]$Level = "Information"  # Information, Warning, Error
    )
    
    # イベントソース作成（初回のみ、管理者権限必要）
    if (-not [System.Diagnostics.EventLog]::SourceExists($Source)) {
        try {
            New-EventLog -LogName Application -Source $Source
        } catch {
            Write-Host "Event source creation requires admin privileges" -ForegroundColor Yellow
        }
    }
    
    # イベント書き込み
    Write-EventLog -LogName Application -Source $Source -EventId $EventId -Message $Message -EntryType $Level
    
    # 重要度に応じて通知
    if ($Level -eq "Warning" -or $Level -eq "Error") {
        Send-WindowsNotification -Title "System Alert" -Message $Message -Icon $Level
    }
}

# 使用例
Write-MonitoringEvent -Message "Docker container memory usage: 85%" -Level "Warning"
```

#### メール通知（オプション）
```powershell
# 3. PowerShell メール通知
function Send-EmailAlert {
    param(
        [string]$To = "admin@example.com",
        [string]$Subject = "System Alert",
        [string]$Body,
        [string]$SmtpServer = "smtp.gmail.com",
        [int]$Port = 587,
        [string]$Username = $env:EMAIL_USERNAME,
        [string]$Password = $env:EMAIL_PASSWORD
    )
    
    try {
        $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($Username, $securePassword)
        
        Send-MailMessage -To $To -Subject $Subject -Body $Body -SmtpServer $SmtpServer -Port $Port -Credential $credential -UseSsl
        Write-Host "Email alert sent successfully" -ForegroundColor Green
    } catch {
        Write-Host "Failed to send email alert: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### 統合監視・通知スクリプト
```powershell
# 4. 統合監視スクリプト（monitor-and-notify.ps1）
function Start-SystemMonitoring {
    param(
        [int]$IntervalSeconds = 300,  # 5分間隔
        [int]$CpuThreshold = 80,
        [int]$MemoryThreshold = 85,
        [int]$DiskThreshold = 90
    )
    
    Write-Host "Starting system monitoring..." -ForegroundColor Green
    Write-Host "Thresholds: CPU $CpuThreshold%, Memory $MemoryThreshold%, Disk $DiskThreshold%" -ForegroundColor Yellow
    
    while ($true) {
        try {
            # CPU使用率チェック
            $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
            if ($cpu -gt $CpuThreshold) {
                $message = "CPU usage is $([math]::Round($cpu, 2))% (threshold: $CpuThreshold%)"
                Write-MonitoringEvent -Message $message -Level "Warning"
                
                # Slack通知（設定されている場合）
                if ($env:SLACK_OAUTH_TOKEN) {
                    ./slack-notify.ps1 -Channel "#monitoring" -Message "🔥 $message"
                }
            }
            
            # メモリ使用率チェック
            $totalMemory = (Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB
            $availableMemory = (Get-Counter "\Memory\Available MBytes").CounterSamples.CookedValue / 1024
            $memoryUsage = [math]::Round((($totalMemory - $availableMemory) / $totalMemory) * 100, 2)
            
            if ($memoryUsage -gt $MemoryThreshold) {
                $message = "Memory usage is $memoryUsage% (threshold: $MemoryThreshold%)"
                Write-MonitoringEvent -Message $message -Level "Warning"
                
                if ($env:SLACK_OAUTH_TOKEN) {
                    ./slack-notify.ps1 -Channel "#monitoring" -Message "💾 $message"
                }
            }
            
            # ディスク使用率チェック
            $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object {$_.DeviceID -eq "C:"}
            $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
            
            if ($diskUsage -gt $DiskThreshold) {
                $message = "Disk usage is $diskUsage% (threshold: $DiskThreshold%)"
                Write-MonitoringEvent -Message $message -Level "Warning"
                
                if ($env:SLACK_OAUTH_TOKEN) {
                    ./slack-notify.ps1 -Channel "#monitoring" -Message "💽 $message"
                }
            }
            
            # Docker コンテナチェック
            $dockerStats = docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemPerc}}" 2>$null
            if ($dockerStats) {
                foreach ($stat in $dockerStats) {
                    $parts = $stat.Split(',')
                    $containerName = $parts[0]
                    $containerCpu = [float]($parts[1] -replace '%', '')
                    $containerMem = [float]($parts[2] -replace '%', '')
                    
                    if ($containerCpu -gt 90 -or $containerMem -gt 90) {
                        $message = "Container $containerName: CPU $containerCpu%, Memory $containerMem%"
                        Write-MonitoringEvent -Message $message -Level "Warning"
                    }
                }
            }
            
            Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Monitoring check completed" -ForegroundColor Gray
            
        } catch {
            Write-Host "Monitoring error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds $IntervalSeconds
    }
}

# バックグラウンド監視開始
# Start-SystemMonitoring -IntervalSeconds 300
```

#### タスクスケジューラー統合
```powershell
# 5. 自動監視タスク登録
function Register-MonitoringTask {
    $taskName = "SystemMonitoring"
    $scriptPath = "C:\workspace\scripts\monitor-and-notify.ps1"
    
    # タスク作成
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "System monitoring and notification"
    
    Write-Host "Monitoring task registered: $taskName" -ForegroundColor Green
}

# 監視タスク登録
# Register-MonitoringTask
```

### 5.3 リソース監視スクリプト（通知統合版）
```powershell
# リソース監視スクリプト
function Get-SystemResources {
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $cpu = Get-WmiObject -Class Win32_Processor
    
    $memoryUsage = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize * 100, 2)
    
    Write-Host "=== System Resources ===" -ForegroundColor Yellow
    Write-Host "Memory Usage: $memoryUsage%" -ForegroundColor $(if($memoryUsage -gt 80) {"Red"} else {"Green"})
    Write-Host "Available Memory: $([math]::Round($memory.FreePhysicalMemory/1MB, 2)) GB" -ForegroundColor Green
}

function Get-DockerResources {
    Write-Host "=== Docker Containers ===" -ForegroundColor Yellow
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

function Get-KubernetesResources {
    Write-Host "=== Kubernetes Resources ===" -ForegroundColor Yellow
    kubectl top nodes
    kubectl top pods --all-namespaces
}

# 実行
Get-SystemResources
Get-DockerResources
Get-KubernetesResources
```

---

## Phase 6: Slack・Notion統合

### 6.1 Slack設定

#### ワークスペース設定
```powershell
# Slack起動後の推奨設定
# 1. 通知設定: 開発中は「重要なメッセージのみ」
# 2. サイドバー: チャンネルを用途別にセクション分け
# 3. テーマ: ダークモード（目の負担軽減）
```

#### 開発チーム向けチャンネル構成
```
📋 推奨チャンネル構成:
├── #general              # 全体連絡
├── #development          # 開発関連
├── #devops              # インフラ・運用
├── #amazon-q-logs       # Amazon Q実行ログ
├── #monitoring          # システム監視アラート
├── #deployments         # デプロイ通知
└── #random              # 雑談
```

#### Slack API統合（開発用）
```powershell
# Slack CLI インストール
winget install SlackTechnologies.SlackCLI

# 認証設定
slack auth
slack workspace list
```

#### 自動通知設定
```powershell
# slack-notify.ps1（システム監視用）
param(
    [string]$Channel = "#monitoring",
    [string]$Message,
    [string]$SlackToken = $env:SLACK_OAUTH_TOKEN
)

$headers = @{
    "Authorization" = "Bearer $SlackToken"
    "Content-Type" = "application/json"
}

$payload = @{
    channel = $Channel
    text = $Message
    username = "Windows-DevEnv"
    icon_emoji = ":computer:"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://slack.com/api/chat.postMessage" -Method Post -Headers $headers -Body $payload
```

### 6.2 Notion設定

#### ワークスペース構成
```
📚 推奨ページ構成:
├── 🏠 Home
├── 📋 Projects
│   ├── Amazon Q Integration
│   ├── Kubernetes Cluster
│   └── Development Tasks
├── 📖 Documentation
│   ├── Setup Guides
│   ├── Troubleshooting
│   └── API References
├── 📊 Monitoring
│   ├── System Metrics
│   ├── Performance Logs
│   └── Incident Reports
└── 🔧 Resources
    ├── Useful Links
    ├── Code Snippets
    └── Configuration Files
```

#### Notion API統合
```powershell
# Notion CLI（非公式）インストール
npm install -g @notionhq/client

# 環境変数設定
$env:NOTION_API_KEY = "secret_your-notion-integration-token"
$env:NOTION_DATABASE_ID = "your-database-id"
```

**🔐 Notion API設定手順:**
```
1. Notion Workspace設定
   - https://www.notion.so/my-integrations にアクセス
   - 「New integration」をクリック
   - Integration名を入力（例: Windows-DevEnv）
   - 「Submit」をクリック

2. API Token取得
   - 作成されたIntegrationの「Internal Integration Token」をコピー
   - 環境変数 NOTION_API_KEY に設定

3. Database設定
   - 対象のNotionページで「Share」→「Invite」
   - 作成したIntegrationを招待
   - Database IDをURLから取得（32文字のハッシュ値）
   - 環境変数 NOTION_DATABASE_ID に設定

4. 権限設定
   - Read content: 有効
   - Update content: 有効
   - Insert content: 有効
```

#### 開発ログ自動記録
```javascript
// notion-logger.js
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function logDevelopmentActivity(title, content, tags = []) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        Tags: {
          multi_select: tags.map(tag => ({ name: tag })),
        },
        Date: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: content,
                },
              },
            ],
          },
        },
      ],
    });
    
    console.log('Logged to Notion:', response.url);
  } catch (error) {
    console.error('Notion logging failed:', error);
  }
}

module.exports = { logDevelopmentActivity };
```

### 6.3 統合ワークフロー

#### 開発タスク管理
```powershell
# task-manager.ps1
param(
    [string]$TaskName,
    [string]$Status = "In Progress",
    [string[]]$Tags = @("development")
)

# Notionにタスク記録
node -e "
const { logDevelopmentActivity } = require('./notion-logger.js');
logDevelopmentActivity('$TaskName', 'Status: $Status', ['$($Tags -join "','")']);
"

# Slackに通知
./slack-notify.ps1 -Channel "#development" -Message "📋 Task Update: $TaskName - $Status"
```

#### システム監視統合
```powershell
# integrated-monitoring.ps1
function Send-SystemAlert {
    param(
        [string]$AlertType,
        [string]$Message,
        [string]$Severity = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fullMessage = "[$timestamp] [$Severity] $AlertType: $Message"
    
    # Slackに即座に通知
    ./slack-notify.ps1 -Channel "#monitoring" -Message $fullMessage
    
    # Notionに詳細ログ記録
    node -e "
    const { logDevelopmentActivity } = require('./notion-logger.js');
    logDevelopmentActivity('System Alert: $AlertType', '$fullMessage', ['monitoring', '$Severity'.toLowerCase()]);
    "
}

# 使用例
Send-SystemAlert -AlertType "Memory Usage" -Message "Memory usage exceeded 85%" -Severity "WARNING"
```

### 6.4 自動化統合

#### 日次レポート生成
```powershell
# daily-report.ps1
function Generate-DailyReport {
    $date = Get-Date -Format "yyyy-MM-dd"
    
    # システムメトリクス収集
    $memoryUsage = Get-WmiObject -Class Win32_OperatingSystem | ForEach-Object {
        [math]::Round(($_.TotalVisibleMemorySize - $_.FreePhysicalMemory) / $_.TotalVisibleMemorySize * 100, 2)
    }
    
    $dockerStats = docker stats --no-stream --format "{{.Container}}: CPU {{.CPUPerc}}, Memory {{.MemUsage}}"
    $k8sStats = kubectl top nodes --no-headers
    
    $report = @"
# Daily Development Report - $date

## System Metrics
- Memory Usage: $memoryUsage%
- Docker Containers: $($dockerStats.Count) running
- Kubernetes Nodes: Online

## Container Status
$($dockerStats -join "`n")

## Kubernetes Status
$k8sStats

## Tasks Completed
- [x] System monitoring check
- [x] Container health verification
- [x] Daily backup execution
"@
    
    # Notionに日次レポート記録
    node -e "
    const { logDevelopmentActivity } = require('./notion-logger.js');
    logDevelopmentActivity('Daily Report - $date', \`$report\`, ['daily-report', 'monitoring']);
    "
    
    # Slackに要約通知
    ./slack-notify.ps1 -Channel "#development" -Message "📊 Daily Report generated - Memory: $memoryUsage%, Containers: $($dockerStats.Count) running"
}

# 毎日午後6時に実行（タスクスケジューラー設定）
# schtasks /create /tn "DailyDevReport" /tr "powershell.exe -File C:\workspace\scripts\daily-report.ps1" /sc daily /st 18:00
```

---

## Phase 7: 運用・メンテナンス

### 7.1 自動化スクリプト

#### daily-maintenance.ps1
```powershell
# 日次メンテナンススクリプト
param(
    [switch]$UpdatePackages,
    [switch]$CleanupDocker,
    [switch]$RestartServices
)

function Update-AllPackages {
    Write-Host "Updating packages..." -ForegroundColor Yellow
    winget upgrade --all --silent
    choco upgrade all -y
}

function Cleanup-DockerResources {
    Write-Host "Cleaning Docker resources..." -ForegroundColor Yellow
    docker system prune -f
    docker volume prune -f
    docker image prune -a -f
}

function Restart-KubernetesServices {
    Write-Host "Restarting Kubernetes services..." -ForegroundColor Yellow
    kubectl rollout restart deployment -n amazon-q
    kubectl rollout restart deployment -n app-stack
}

if ($UpdatePackages) { Update-AllPackages }
if ($CleanupDocker) { Cleanup-DockerResources }
if ($RestartServices) { Restart-KubernetesServices }

Write-Host "Maintenance completed!" -ForegroundColor Green
```

### 7.2 バックアップ戦略

#### backup-config.ps1
```powershell
# 設定バックアップスクリプト
$backupPath = "C:\Backup\DevEnvironment\$(Get-Date -Format 'yyyyMMdd')"
New-Item -ItemType Directory -Path $backupPath -Force

# Kubernetes設定
kubectl get all --all-namespaces -o yaml > "$backupPath\k8s-resources.yaml"

# Docker Compose設定
Copy-Item "C:\workspace\docker-compose.yml" "$backupPath\"

# パッケージリスト
winget export -o "$backupPath\winget-packages.json"
choco list --local-only > "$backupPath\choco-packages.txt"

# Slack・Notion設定
Copy-Item "$env:APPDATA\Slack\*" "$backupPath\Slack\" -Recurse -Force
Copy-Item "$env:APPDATA\Notion\*" "$backupPath\Notion\" -Recurse -Force

Write-Host "Backup completed: $backupPath" -ForegroundColor Green

# Notionに記録
node -e "
const { logDevelopmentActivity } = require('./notion-logger.js');
logDevelopmentActivity('System Backup Completed', 'Backup path: $backupPath', ['backup', 'maintenance']);
"
```

---

## Phase 8: セキュリティ強化

### 8.1 ネットワークセキュリティ

#### ファイアウォール設定
```powershell
# Windows Defender Firewall強化
# 開発用ポートのみ許可
New-NetFirewallRule -DisplayName "Kubernetes API" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow
New-NetFirewallRule -DisplayName "Docker API" -Direction Inbound -Protocol TCP -LocalPort 2376 -Action Allow
New-NetFirewallRule -DisplayName "Grafana Dashboard" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# 不要なポートをブロック
New-NetFirewallRule -DisplayName "Block Telnet" -Direction Inbound -Protocol TCP -LocalPort 23 -Action Block
New-NetFirewallRule -DisplayName "Block FTP" -Direction Inbound -Protocol TCP -LocalPort 21 -Action Block
New-NetFirewallRule -DisplayName "Block SMB" -Direction Inbound -Protocol TCP -LocalPort 445 -Action Block
```

#### DNS設定（セキュリティ強化）
```powershell
# Cloudflare DNS（マルウェアブロック付き）
netsh interface ip set dns "Wi-Fi" static 1.1.1.2
netsh interface ip add dns "Wi-Fi" 1.0.0.2 index=2

# DNS over HTTPS有効化
netsh dns add encryption server=1.1.1.2 dohtemplate=https://security.cloudflare-dns.com/dns-query
```

### 8.2 認証・認可強化

#### 多要素認証設定
```powershell
# GitHub 2FA設定確認
gh auth status

# AWS MFA設定
aws configure set mfa_serial arn:aws:iam::ACCOUNT:mfa/USERNAME
aws sts get-session-token --serial-number arn:aws:iam::ACCOUNT:mfa/USERNAME --token-code 123456
```

#### 証明書管理
```powershell
# 自己署名証明書作成（開発用）
New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1" -CertStoreLocation "cert:\LocalMachine\My" -KeyUsage DigitalSignature,KeyEncipherment -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Docker TLS設定
$env:DOCKER_TLS_VERIFY = "1"
$env:DOCKER_CERT_PATH = "$env:USERPROFILE\.docker\machine\certs"
```

### 8.3 データ保護（Microsoft純正）

#### ファイルレベル暗号化（Windows 11 Home対応）
```powershell
# 1. EFS（Encrypting File System）- Windows 11 Home対応
cipher /e /s:C:\workspace

# 2. Device Encryption確認（Windows 11 Home）
# 設定 > プライバシーとセキュリティ > デバイスの暗号化
# 注意: TPM 2.0 + UEFI + Secure Boot が必要
Get-BitLockerVolume 2>$null
if ($?) {
    Write-Host "Device Encryption available" -ForegroundColor Green
} else {
    Write-Host "Device Encryption not available - using EFS" -ForegroundColor Yellow
}

# 3. Windows 11 Home用の暗号化確認
$encryptionStatus = Get-WmiObject -Class Win32_EncryptableVolume -Namespace "Root\CIMv2\Security\MicrosoftVolumeEncryption" -ErrorAction SilentlyContinue
if ($encryptionStatus) {
    Write-Host "Volume encryption supported" -ForegroundColor Green
} else {
    Write-Host "Using file-level encryption (EFS)" -ForegroundColor Yellow
}

# 4. EFS証明書バックアップ（重要）
$certPath = "$env:USERPROFILE\Documents\EFS_Certificate_Backup.pfx"
$password = Read-Host "Enter certificate backup password" -AsSecureString
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\*" -FilePath $certPath -Password $password -ChainOption EndEntityCertOnly
Write-Host "EFS certificate backed up to: $certPath" -ForegroundColor Green
```

**💡 Windows 11 Home暗号化オプション:**
```
優先順位:
1. Device Encryption（利用可能な場合）
   - TPM 2.0 + UEFI + Secure Boot必須
   - 設定 > プライバシーとセキュリティ > デバイスの暗号化

2. EFS（Encrypting File System）
   - ファイル・フォルダレベル暗号化
   - Windows 11 Home標準対応
   - 証明書バックアップ必須

3. 圧縮暗号化（最低限）
   - PowerShell + AES暗号化
   - プロジェクト単位での暗号化
```

#### バックアップ暗号化（Windows標準）
```powershell
# 1. Windows標準の圧縮・暗号化
Compress-Archive -Path "C:\workspace" -DestinationPath "C:\Backup\workspace-$(Get-Date -Format 'yyyyMMdd').zip"

# 2. PowerShell暗号化スクリプト
$secureString = ConvertTo-SecureString "backup-password" -AsPlainText -Force
$encryptedData = ConvertFrom-SecureString $secureString
$encryptedData | Out-File "C:\Backup\encrypted-backup.txt"

# 3. BitLocker（利用可能な場合）
# Windows 11 Pro/Enterprise のみ
if (Get-Command Enable-BitLocker -ErrorAction SilentlyContinue) {
    Enable-BitLocker -MountPoint "C:" -EncryptionMethod XtsAes256 -UsedSpaceOnly
    Write-Host "BitLocker enabled" -ForegroundColor Green
} else {
    Write-Host "BitLocker not available (Windows 11 Home)" -ForegroundColor Yellow
}
```

#### Windows Information Protection（WIP）
```powershell
# Windows 11 Pro/Enterprise での企業データ保護
# 注意: Home版では利用不可

# 1. WIP設定確認
Get-WipFileInfo -Path "C:\workspace"

# 2. 企業データとしてマーク（管理者権限必要）
# Set-WipFileInfo -Path "C:\workspace" -Enterprise
```

### 8.4 監査・ログ管理

#### セキュリティログ設定
```powershell
# PowerShell実行ログ有効化
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 1

# Docker監査ログ
# daemon.json設定
@{
  "log-driver" = "json-file"
  "log-opts" = @{
    "max-size" = "10m"
    "max-file" = "3"
  }
  "audit-log-path" = "C:\ProgramData\Docker\audit.log"
  "audit-log-maxsize" = "10m"
  "audit-log-maxbackups" = "5"
} | ConvertTo-Json | Out-File -FilePath "C:\ProgramData\Docker\config\daemon.json"
```

#### 侵入検知
```powershell
# Sysmon設定（高度なログ収集）
winget install Microsoft.Sysinternals.Sysmon
sysmon -accepteula -i sysmonconfig.xml

# Windows Event Log監視
wevtutil sl Security /ms:1048576000
wevtutil sl System /ms:1048576000
```

---

## Phase 9: トラブルシューティング

### 9.1 よくある問題と解決策

#### メモリ不足
```powershell
# メモリ使用量確認
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10

# Kubernetes Pod制限
kubectl patch deployment mysql -n app-stack -p '{"spec":{"template":{"spec":{"containers":[{"name":"mysql","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
```

#### Docker Desktop問題
```powershell
# Docker Desktop再起動
Stop-Service com.docker.service
Start-Service com.docker.service

# WSL2リセット
wsl --shutdown
wsl --unregister docker-desktop-data
```

#### Kubernetes接続問題
```powershell
# minikube再起動
minikube stop
minikube start

# kubectl設定確認
kubectl config current-context
kubectl cluster-info
```

### 9.2 パフォーマンス最適化

#### システム最適化
```powershell
# 不要サービス停止
Stop-Service "Fax"
Stop-Service "XblAuthManager"
Stop-Service "XblGameSave"

# AMD Ryzen最適化設定
# 電源プラン: 高パフォーマンス
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

# AMD Ryzen Master互換性（オプション）
# AMD Ryzen Masterがインストールされている場合の設定
# Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Power" -Name "PlatformAoAcOverride" -Value 0

# 視覚効果無効化
SystemPropertiesPerformance.exe

# Slack・Notion最適化
# Slack: 設定 > 詳細設定 > ハードウェアアクセラレーション無効
# Notion: 設定 > 外観 > 「システムリソースを節約」有効
```

#### 通知最適化
```powershell
# 開発集中時間の通知制御
function Set-FocusMode {
    param([bool]$Enable = $true)
    
    if ($Enable) {
        # Slack通知一時停止（2時間）
        slack status set --text "🔧 Deep Work Mode" --emoji ":wrench:" --duration 7200
        
        # Windows通知無効化
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications" -Name "ToastEnabled" -Value 0
        
        Write-Host "Focus mode enabled for 2 hours" -ForegroundColor Green
    } else {
        # 通知復活
        slack status clear
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications" -Name "ToastEnabled" -Value 1
        
        Write-Host "Focus mode disabled" -ForegroundColor Yellow
    }
}
```

---

## 付録

### A. リソース配分表（軽量構成）

| コンポーネント | CPU | メモリ | GPU/NPU | 備考 |
|---|---|---|---|---|
| Windows 11 Home | 2コア | 8GB | - | OS基本 + 軽量監視 |
| Docker Desktop (WSL2) | 8コア | 12GB | Radeon 780M | コンテナ実行環境 |
| Amazon Q × 4 | 4コア | 8GB | NPU 16TOPS | AI推論最適化 |
| App Stack × 7 | 2コア | 4GB | - | 軽量設定 |
| **合計** | **16スレッド活用** | **32GB** | **統合APU最適化** | **Microsoft純正中心** |

### A2. 監視・セキュリティツール

| 機能 | ツール | ライセンス | 更新方法 | 備考 |
|---|---|---|---|---|
| **システム監視** | Performance Monitor | 無料（標準） | Windows Update | Microsoft純正 |
| **管理ダッシュボード** | Windows Admin Center | 無料 | Windows Update | Microsoft製 |
| **コンテナ監視** | Docker Desktop | 無料 | 自動更新 | 内蔵監視機能 |
| **暗号化** | EFS + BitLocker | 無料（標準） | Windows Update | Windows標準 |
| **セキュリティ** | Windows Defender | 無料（標準） | Windows Update | Microsoft純正 |
| **ファイアウォール** | Windows Firewall | 無料（標準） | Windows Update | Windows標準 |

### B. 統合ワークフロー

| 機能 | Slack | Notion | 自動化 |
|---|---|---|---|
| タスク管理 | 進捗通知 | 詳細記録 | ✅ |
| システム監視 | アラート通知 | ログ保存 | ✅ |
| 日次レポート | 要約通知 | 詳細レポート | ✅ |
| バックアップ | 完了通知 | 履歴管理 | ✅ |

### C. ポート一覧（軽量構成）

| サービス | ポート | 用途 | セキュリティ | 監視方法 |
|---|---|---|---|---|
| Kubernetes API | 8443 | クラスター管理 | TLS暗号化 | kubectl |
| Docker API | 2376 | Docker管理 | TLS暗号化 | docker stats |
| Windows Admin Center | 6516 | システム管理 | HTTPS | Microsoft純正 |
| MySQL | 3306 | データベース | 内部ネットワーク | Performance Monitor |
| Redis | 6379 | キャッシュ | 内部ネットワーク | Performance Monitor |
| Nginx | 80, 443 | Webサーバー | HTTPS強制 | IIS Manager |
| SSH | 22 | Git接続 | 鍵認証のみ | Windows Event Log |

### D. 緊急時対応

#### 全サービス停止
```powershell
# 緊急停止スクリプト
kubectl delete --all deployments --all-namespaces
minikube stop
docker stop $(docker ps -aq)

# 通知送信
./slack-notify.ps1 -Channel "#monitoring" -Message "🚨 Emergency shutdown executed"
```

#### 設定リセット
```powershell
# 完全リセット
minikube delete
docker system prune -af --volumes

# Slack・Notion設定保持
# 再セットアップ実行
```

### E. 環境変数設定

#### 必須環境変数
```powershell
# システム環境変数設定
[Environment]::SetEnvironmentVariable("SLACK_OAUTH_TOKEN", "xoxb-your-slack-oauth-token", "User")
[Environment]::SetEnvironmentVariable("NOTION_API_KEY", "secret_your-notion-integration-token", "User")
[Environment]::SetEnvironmentVariable("NOTION_DATABASE_ID", "your-database-id", "User")

# SSH設定
[Environment]::SetEnvironmentVariable("SSH_AUTH_SOCK", "$env:USERPROFILE\.ssh\ssh-agent.sock", "User")

# Docker TLS設定
[Environment]::SetEnvironmentVariable("DOCKER_TLS_VERIFY", "1", "User")
[Environment]::SetEnvironmentVariable("DOCKER_CERT_PATH", "$env:USERPROFILE\.docker\machine\certs", "User")
```

**🔐 セキュリティ設定確認:**
```powershell
# 環境変数の暗号化確認
Get-ItemProperty -Path "HKCU:\Environment" | Where-Object {$_.Name -like "*TOKEN*" -or $_.Name -like "*KEY*"}

# SSH Agent動作確認
ssh-add -l

# Git SSH接続確認
ssh -T git@github.com
```

---

## Windows 11 Home 特有の注意事項

### 制限事項と対策

#### 1. **Hyper-V非対応**
```
❌ 制限: Hyper-Vが利用不可
✅ 対策: Docker Desktop WSL2バックエンド使用
✅ 結果: Kubernetesは正常動作（性能差なし）
```

#### 2. **グループポリシー非対応**
```
❌ 制限: gpedit.mscが利用不可
✅ 対策: レジストリ直接編集で同等機能実現
✅ 結果: セキュリティ設定は手動で管理
```

#### 3. **BitLocker制限**
```
❌ 制限: BitLocker暗号化が制限的
✅ 対策: VeraCryptなどサードパーティ暗号化ツール使用
✅ 結果: データ保護は代替手段で実現
```

### Ryzen 7 8845HS 最適化ポイント

#### 0. **BIOS/UEFI推奨設定**
```
🔧 起動時にF2/F12/DELキーでBIOS/UEFI設定画面に入る

【重要設定項目】
├── UMA Frame Buffer Size: 4GB以上（Radeon 780M用）
├── Memory Profile: DOCP/XMP有効（DDR5-5600動作確認）
├── AMD Ryzen AI: Enabled（NPU有効化）
├── Precision Boost Overdrive: Enabled（自動OC）
├── AMD fTPM: Enabled（セキュリティ）
├── Secure Boot: Enabled（Windows 11要件）
└── Virtualization: AMD-V + IOMMU有効（Docker/WSL2用）

【パフォーマンス設定】
├── Power Management: Maximum Performance
├── CPU Boost: Auto/Enabled
├── Memory Timing: Auto（DDR5-5600確認）
└── PCIe: Gen4有効
```

#### 1. **マルチスレッド活用**
```powershell
# 8コア/16スレッドを最大活用
# Docker: 8コア割り当て
# minikube: 6コア割り当て
# 残り2コア: Windows + その他アプリ
```

#### 2. **AMD固有設定**
```powershell
# AMD Ryzen Master（オプション）
winget install AMD.RyzenMaster

# 電源設定最適化
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

**📋 電源プラン設定の参考情報:**
```powershell
# 事前確認: 利用可能な電源プラン一覧表示
powercfg /list

# 出力例:
# 電源設定の GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス) *
# 電源設定の GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  (高パフォーマンス)
# 電源設定の GUID: a1841308-3541-4fab-bc81-f71556f20b4a  (省電力)

# 現在の電源プラン確認
powercfg /getactivescheme

# 安全な設定変更（高パフォーマンスプランが存在する場合のみ実行）
$schemes = powercfg /list
if ($schemes -match "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c") {
    powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
    Write-Host "高パフォーマンスプランに設定完了" -ForegroundColor Green
} else {
    Write-Host "高パフォーマンスプランが見つかりません" -ForegroundColor Red
}
```

**💡 GUID値について:**
- `8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`: Windows標準の「高パフォーマンス」電源プラン
- Microsoft公式定義（Windows SDK `powrprof.h`で確認可能）
- 環境によっては存在しない場合があるため、事前確認が必要

#### 3. **メモリ最適化**
```powershell
# DDR5-5600メモリの最適化
# ページファイル設定: 固定16GB
wmic pagefileset where name="C:\\pagefile.sys" set InitialSize=16384,MaximumSize=16384

# メモリ圧縮無効化（32GB環境では不要）
Disable-MMAgent -MemoryCompression

# DDR5高速メモリ用の追加設定
# メモリマップドファイルの最適化
fsutil behavior set memoryusage 2
```

#### 4. **NPU・統合GPU最適化（Ryzen AI + Radeon 780M）**
```powershell
# AMD Ryzen AI NPU設定（16 TOPS対応）
# NPU利用可能性確認
Get-WmiObject -Class Win32_PnPEntity | Where-Object {$_.Name -like "*NPU*" -or $_.Name -like "*AI*"}

# Windows AI Platform有効化
# 設定 > システム > 開発者向け > 「Windows AI Platform」を有効化

# Radeon 780M統合GPU最適化
# UMAフレームバッファサイズ設定（BIOS/UEFI設定推奨: 4GB以上）
# レジストリでのGPUメモリ割り当て確認
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\0000" -Name "HardwareInformation.qwMemorySize" -ErrorAction SilentlyContinue
```

#### 5. **DDR5-5600メモリ帯域幅最適化**
```powershell
# メモリサブシステム最適化
# Large Page Support有効化（大容量メモリページ）
bcdedit /set IncreaseUserVa 3072

# NUMA最適化（APU統合環境用）
bcdedit /set groupsize 2

# メモリプリフェッチ最適化
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters" -Name "EnablePrefetcher" -Value 3
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters" -Name "EnableSuperfetch" -Value 3
```

#### 6. **AI・機械学習ワークロード対応**
```powershell
# Windows Machine Learning (WinML) 最適化
# DirectML有効化確認
Get-WindowsCapability -Online | Where-Object Name -like "*DirectX*"

# NPU利用のためのランタイム設定
# ONNX Runtime with DirectML provider
# 環境変数設定
[Environment]::SetEnvironmentVariable("OMP_NUM_THREADS", "16", "User")
[Environment]::SetEnvironmentVariable("ONNXRUNTIME_PROVIDERS", "DmlExecutionProvider,CPUExecutionProvider", "User")
```

---

**作成日**: 2024-11-08  
**更新日**: 2024-11-08  
**バージョン**: 1.1  
**対象**: Windows 11 Home + AMD Ryzen 7 8845HS (32GB RAM)

---

## 📋 実装経緯・参考情報

### 🎯 **ドキュメント作成の背景**
```
課題: Windows 11での効率的な開発環境構築
要件: Kubernetes + 11コンテナ + Amazon Q同時稼働
制約: 32GBメモリ内での最適リソース配分
目標: 開発効率とシステム安定性の両立
```

### 🔄 **段階的な要件変更と対応**

#### Phase 1: 基本要件定義
```
初期要件:
- Windows 11での開発基盤構築
- Kubernetes + 11コンテナ環境
- Amazon Q × 4 + アプリケーションスタック × 7
- メモリ32GB環境での最適化
```

#### Phase 2: OS・CPU仕様の具体化
```
追加情報:
- Windows 11 Home（Pro/Enterpriseから変更）
- AMD Ryzen 7 8845HS（具体的CPU型番判明）
- Hyper-V非対応 → WSL2 + Docker Desktop代替案
- AMD固有最適化の必要性
```

#### Phase 3: 詳細ハードウェア仕様の反映
```
最終仕様:
- NPU: Ryzen AI（16 TOPS）
- GPU: Radeon 780M（統合）
- メモリ: DDR5-5600 (16GB×2)
- チップセット: APU統合
- AI推論・GPU処理の最適化要件追加
```

### 🛠️ **技術選択の根拠**

#### パッケージ管理: winget + Chocolatey
```
選択理由:
✅ winget: Microsoft公式、Windows 11標準搭載
✅ Chocolatey: 豊富な開発ツール、依存関係自動解決
❌ Scoop: 軽量だが企業環境での制約
❌ 手動インストール: 保守性・再現性の問題
```

#### コンテナ環境: Docker Desktop + minikube
```
選択理由:
✅ Docker Desktop: Windows 11 Home対応、WSL2統合
✅ minikube: 軽量、開発環境に最適
❌ Docker CE: Windows Home非対応
❌ Kind: 複雑な設定、リソース効率劣る
❌ Rancher Desktop: 新しすぎる、安定性未知数
```

#### セキュリティ: Windows Defender単体
```
選択理由:
✅ 十分な検出率（90%以上）、軽量
✅ コンテナ分離環境での脅威限定
✅ 開発効率重視（誤検知・パフォーマンス低下回避）
❌ サードパーティ製品: リソース消費大、競合リスク
```

### 🔧 **最適化設定の技術的根拠**

#### NPU・GPU統合の実装判断
```
技術背景:
- Ryzen AI NPU: 2024年新技術、16 TOPS性能
- Windows AI Platform: Microsoft公式NPU対応
- DirectML: Windows標準GPU機械学習フレームワーク
- ONNX Runtime: クロスプラットフォームAI推論

実装理由:
✅ Amazon QのAI推論高速化（3-5倍性能向上期待）
✅ CPU負荷軽減によるマルチタスク性能向上
✅ 将来のAIワークロード拡張への対応
```

#### メモリ・電源最適化の根拠
```
DDR5-5600最適化:
- 帯域幅: 従来DDR4比40%向上
- レイテンシ: 大容量ワークロードで効果大
- プリフェッチ: コンテナ起動時間短縮

電源プラン設定:
- GUID確認: 環境依存性への対応
- 高パフォーマンス: CPU全コア最大クロック維持
- AMD固有設定: Precision Boost最適化
```

### 📊 **リソース配分の設計思想**

#### 32GB配分戦略
```
設計原則:
1. OS安定性確保: 6GB（最低4GB + 余裕2GB）
2. Docker最大活用: 12GB（コンテナ密度最適化）
3. Amazon Q優先: 8GB（AI推論性能重視）
4. アプリ軽量化: 4GB（必要最小限）
5. 通信ツール: 2GB（Slack・Notion）

根拠:
- メモリ不足時の影響度順に優先度設定
- スワップ発生回避（SSD寿命・性能維持）
- 将来拡張性の考慮（追加コンテナ対応）
```

### 🔍 **トラブルシューティング設計**

#### 段階的診断アプローチ
```
Level 1: 基本確認（powercfg, docker stats）
Level 2: 詳細分析（kubectl top, WSL診断）
Level 3: 根本対策（設定リセット、再構築）

自動化方針:
- 日次メンテナンス: 予防保守重視
- 監視統合: Slack即時通知 + Notion履歴管理
- バックアップ: 設定復旧の迅速化
```

### 🚀 **将来拡張性の考慮**

#### 技術進歩への対応
```
NPU技術進歩:
- Ryzen AI次世代（50+ TOPS予想）
- Windows AI Platform機能拡張
- ONNX Runtime最適化

コンテナ技術:
- WebAssembly統合
- Kubernetes軽量化
- エッジAI対応

開発ツール:
- Amazon Q機能拡張
- AI支援開発環境
- クラウドネイティブ対応
```

### 📝 **ドキュメント保守方針**
```
更新トリガー:
- ハードウェア仕様変更
- OS・ソフトウェアメジャーアップデート
- パフォーマンス問題・改善案発見
- ユーザーフィードバック

品質保証:
- 実環境での検証必須
- 段階的導入推奨
- ロールバック手順整備
```
