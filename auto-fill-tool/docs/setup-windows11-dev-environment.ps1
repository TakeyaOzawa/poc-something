# Windows 11 開発基盤環境構築 自動セットアップスクリプト
# 対象: Windows 11 Home + AMD Ryzen 7 8845HS (32GB RAM)
# 作成日: 2024-11-08
# バージョン: 1.0

param(
    [switch]$Phase1,    # システム基盤セットアップ
    [switch]$Phase2,    # パッケージ管理システム構築
    [switch]$Phase3,    # Docker & Kubernetes セットアップ
    [switch]$Phase4,    # 11コンテナ環境構築
    [switch]$Phase5,    # リソース監視・最適化
    [switch]$All,       # 全フェーズ実行
    [switch]$Check      # 環境確認のみ
)

# 管理者権限確認
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "このスクリプトは管理者権限で実行してください。" -ForegroundColor Red
    Write-Host "PowerShellを右クリック → '管理者として実行' を選択してください。" -ForegroundColor Yellow
    exit 1
}

# スクリプトディレクトリ設定
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = "$ScriptDir\setup-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

# ログ関数
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "WARNING" { "Yellow" }
            "SUCCESS" { "Green" }
            default { "White" }
        }
    )
    Add-Content -Path $LogFile -Value $logMessage
}

# エラーハンドリング
$ErrorActionPreference = "Stop"
trap {
    Write-Log "エラーが発生しました: $($_.Exception.Message)" "ERROR"
    Write-Log "スクリプトを終了します。" "ERROR"
    exit 1
}

Write-Log "Windows 11 開発環境セットアップを開始します" "SUCCESS"
Write-Log "ログファイル: $LogFile" "INFO"

# 環境確認関数
function Test-Environment {
    Write-Log "=== 環境確認を実行中 ===" "INFO"
    
    # OS確認
    $os = Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion
    Write-Log "OS: $($os.WindowsProductName) $($os.WindowsVersion)" "INFO"
    
    # CPU確認
    $cpu = Get-WmiObject -Class Win32_Processor
    Write-Log "CPU: $($cpu.Name)" "INFO"
    Write-Log "コア/スレッド: $($cpu.NumberOfCores)/$($cpu.NumberOfLogicalProcessors)" "INFO"
    
    # メモリ確認
    $memory = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    Write-Log "メモリ: $memory GB" $(if($memory -ge 32) {"SUCCESS"} else {"WARNING"})
    
    if ($memory -lt 32) {
        Write-Log "推奨メモリ容量は32GB以上です。現在: $memory GB" "WARNING"
    }
    
    # TPM・Secure Boot確認
    try {
        $tpm = Get-Tpm
        Write-Log "TPM: $($tpm.TpmPresent) (Ready: $($tmp.TmpReady))" "INFO"
    } catch {
        Write-Log "TPM情報を取得できませんでした" "WARNING"
    }
    
    try {
        Confirm-SecureBootUEFI | Out-Null
        Write-Log "Secure Boot: 有効" "SUCCESS"
    } catch {
        Write-Log "Secure Boot: 無効" "WARNING"
    }
}

# Phase 1: システム基盤セットアップ
function Start-Phase1 {
    Write-Log "=== Phase 1: システム基盤セットアップ ===" "SUCCESS"
    
    # Windows Update確認
    Write-Log "Windows Update状態を確認中..." "INFO"
    try {
        $updateSession = New-Object -ComObject Microsoft.Update.Session
        $updateSearcher = $updateSession.CreateUpdateSearcher()
        $searchResult = $updateSearcher.Search("IsInstalled=0")
        if ($searchResult.Updates.Count -eq 0) {
            Write-Log "Windows Update: 最新状態" "SUCCESS"
        } else {
            Write-Log "Windows Update: $($searchResult.Updates.Count)個の更新が利用可能" "WARNING"
            Write-Log "設定 > Windows Update から更新を適用してください" "WARNING"
        }
    } catch {
        Write-Log "Windows Update状態の確認に失敗しました" "WARNING"
    }
    
    # WSL2有効化
    Write-Log "WSL2機能を有効化中..." "INFO"
    try {
        dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
        dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
        Write-Log "WSL2機能の有効化が完了しました" "SUCCESS"
        Write-Log "再起動後にWSL2の設定を続行してください" "WARNING"
    } catch {
        Write-Log "WSL2機能の有効化に失敗しました: $($_.Exception.Message)" "ERROR"
    }
    
    # メモリ最適化（AMD Ryzen 7 8845HS専用）
    Write-Log "メモリ最適化設定を適用中..." "INFO"
    try {
        # ページファイルサイズ: 16GB固定
        wmic pagefileset where name="C:\\pagefile.sys" set InitialSize=16384,MaximumSize=16384
        Write-Log "ページファイルサイズを16GB固定に設定しました" "SUCCESS"
        
        # AMD Ryzen用メモリ最適化
        bcdedit /set IncreaseUserVa 3072
        bcdedit /set groupsize 2
        Write-Log "AMD Ryzen用メモリ最適化を適用しました" "SUCCESS"
        
        # メモリプリフェッチ最適化
        Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters" -Name "EnablePrefetcher" -Value 3
        Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters" -Name "EnableSuperfetch" -Value 3
        Write-Log "メモリプリフェッチ最適化を適用しました" "SUCCESS"
        
        # メモリ圧縮無効化
        Disable-MMAgent -MemoryCompression
        Write-Log "メモリ圧縮を無効化しました（32GB環境では不要）" "SUCCESS"
    } catch {
        Write-Log "メモリ最適化設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
    
    # Windows Defender最適化
    Write-Log "Windows Defender除外設定を適用中..." "INFO"
    try {
        $exclusionPaths = @(
            "C:\workspace",
            "C:\Users\$env:USERNAME\.docker",
            "C:\Users\$env:USERNAME\.kube",
            "C:\Users\$env:USERNAME\.wsl",
            "C:\ProgramData\Docker"
        )
        
        foreach ($path in $exclusionPaths) {
            Add-MpPreference -ExclusionPath $path
        }
        
        $exclusionProcesses = @(
            "docker.exe",
            "dockerd.exe", 
            "kubectl.exe",
            "minikube.exe",
            "wsl.exe",
            "wslhost.exe"
        )
        
        foreach ($process in $exclusionProcesses) {
            Add-MpPreference -ExclusionProcess $process
        }
        
        Set-MpPreference -DisableScriptScanning $true
        Set-MpPreference -DisableArchiveScanning $true
        
        Write-Log "Windows Defender除外設定を適用しました" "SUCCESS"
    } catch {
        Write-Log "Windows Defender設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

# Phase 2: パッケージ管理システム構築
function Start-Phase2 {
    Write-Log "=== Phase 2: パッケージ管理システム構築 ===" "SUCCESS"
    
    # winget更新
    Write-Log "wingetを更新中..." "INFO"
    try {
        winget source update
        winget upgrade Microsoft.AppInstaller
        Write-Log "wingetの更新が完了しました" "SUCCESS"
    } catch {
        Write-Log "wingetの更新に失敗しました: $($_.Exception.Message)" "WARNING"
    }
    
    # Chocolatey インストール
    Write-Log "Chocolateyをインストール中..." "INFO"
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Chocolatey最適化設定
        choco feature enable -n checksumFiles
        choco feature enable -n allowGlobalConfirmation
        choco feature enable -n useRememberedArgumentsForUpgrades
        
        Write-Log "Chocolateyのインストールが完了しました" "SUCCESS"
    } catch {
        Write-Log "Chocolateyのインストールに失敗しました: $($_.Exception.Message)" "ERROR"
    }
    
    # 基本ツールインストール（winget）
    Write-Log "基本ツールをインストール中..." "INFO"
    $wingetPackages = @(
        "Git.Git",
        "Microsoft.PowerShell", 
        "Microsoft.WindowsTerminal",
        "Microsoft.VisualStudioCode",
        "Docker.DockerDesktop",
        "7zip.7zip",
        "Mozilla.Firefox",
        "Google.Chrome",
        "SlackTechnologies.Slack",
        "Notion.Notion"
    )
    
    foreach ($package in $wingetPackages) {
        try {
            Write-Log "インストール中: $package" "INFO"
            winget install $package --silent --accept-package-agreements
            Write-Log "インストール完了: $package" "SUCCESS"
        } catch {
            Write-Log "インストール失敗: $package - $($_.Exception.Message)" "WARNING"
        }
    }
    
    # 開発ツール（Chocolatey）
    Write-Log "開発ツールをインストール中..." "INFO"
    $chocoPackages = @(
        "nodejs-lts",
        "python312",
        "golang",
        "kubernetes-cli",
        "kubernetes-helm",
        "minikube",
        "awscli",
        "terraform",
        "openssh",
        "jq",
        "yq",
        "ripgrep",
        "fd",
        "make",
        "cmake",
        "gh",
        "curl",
        "wget"
    )
    
    foreach ($package in $chocoPackages) {
        try {
            Write-Log "インストール中: $package" "INFO"
            choco install $package -y
            Write-Log "インストール完了: $package" "SUCCESS"
        } catch {
            Write-Log "インストール失敗: $package - $($_.Exception.Message)" "WARNING"
        }
    }
    
    # バージョン管理ツール（オプション）
    Write-Log "バージョン管理ツールをインストール中..." "INFO"
    try {
        # Node.js バージョン管理
        choco install nvm-windows -y
        Write-Log "nvm-windows インストール完了" "SUCCESS"
        
        # Python バージョン管理
        choco install pyenv-win -y
        Write-Log "pyenv-win インストール完了" "SUCCESS"
        
    # インストール確認
    Write-Log "インストール状況を確認中..." "INFO"
    $tools = @{
        "Git" = "git --version"
        "Node.js" = "node --version"
        "Python" = "python --version"
        "Docker" = "docker --version"
        "kubectl" = "kubectl version --client"
        "PowerShell" = "$($PSVersionTable.PSVersion)"
        "Go" = "go version"
        "AWS CLI" = "aws --version"
        "Terraform" = "terraform --version"
    }
    
    foreach ($tool in $tools.GetEnumerator()) {
        try {
            if ($tool.Key -eq "PowerShell") {
                $version = $tool.Value
            } else {
                $version = Invoke-Expression $tool.Value 2>$null
            }
            Write-Log "✅ $($tool.Key): $version" "SUCCESS"
        } catch {
            Write-Log "❌ $($tool.Key): 未インストールまたはPATHに未設定" "WARNING"
        }
    }
}
}

# Phase 3: Docker & Kubernetes セットアップ
function Start-Phase3 {
    Write-Log "=== Phase 3: Docker & Kubernetes セットアップ ===" "SUCCESS"
    
    # Docker Desktop設定ファイル作成（AMD Ryzen 7 8845HS最適化）
    Write-Log "Docker Desktop設定ファイルを作成中..." "INFO"
    $dockerConfigPath = "$env:APPDATA\Docker\settings.json"
    $dockerConfigDir = Split-Path $dockerConfigPath -Parent
    
    if (-not (Test-Path $dockerConfigDir)) {
        New-Item -ItemType Directory -Path $dockerConfigDir -Force
    }
    
    $dockerConfig = @{
        "memoryMiB" = 12288
        "cpus" = 8
        "diskSizeMiB" = 102400
        "swapMiB" = 2048
        "kubernetesEnabled" = $true
        "kubernetesInitialInstallPerformed" = $true
        "wslEngineEnabled" = $true
        "useWindowsContainers" = $false
        "exposeDockerAPIOnTcp2375" = $false
        "useVirtualizationFramework" = $true
        "useGrpcfuse" = $true
        "vpnKitMaxPortIdleTime" = "300s"
    } | ConvertTo-Json -Depth 10
    
    try {
        $dockerConfig | Out-File -FilePath $dockerConfigPath -Encoding UTF8
        Write-Log "Docker Desktop設定ファイルを作成しました" "SUCCESS"
    } catch {
        Write-Log "Docker Desktop設定ファイル作成に失敗しました: $($_.Exception.Message)" "WARNING"
    }
    
    # Docker Desktop起動確認
    Write-Log "Docker Desktopの起動を確認中..." "INFO"
    $dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $dockerProcess) {
        Write-Log "Docker Desktopを起動中..." "INFO"
        Start-Process "Docker Desktop"
        Start-Sleep 30
    }
    
    # Docker動作確認
    $retryCount = 0
    $maxRetries = 10
    while ($retryCount -lt $maxRetries) {
        try {
            docker --version | Out-Null
            Write-Log "Docker動作確認: 成功" "SUCCESS"
            break
        } catch {
            $retryCount++
            Write-Log "Docker起動待機中... ($retryCount/$maxRetries)" "INFO"
            Start-Sleep 10
        }
    }
    
    if ($retryCount -eq $maxRetries) {
        Write-Log "Dockerの起動に失敗しました" "ERROR"
        return
    }
    
    # Docker情報確認
    try {
        Write-Log "Docker情報:" "INFO"
        docker info --format "{{.ServerVersion}}"
        docker system df
        Write-Log "Docker設定確認完了" "SUCCESS"
    } catch {
        Write-Log "Docker情報取得に失敗しました" "WARNING"
    }
    
    # minikube設定（AMD Ryzen 7 8845HS最適化）
    Write-Log "minikubeを設定中..." "INFO"
    try {
        minikube config set memory 10240
        minikube config set cpus 6
        minikube config set disk-size 40g
        minikube config set driver docker
        minikube config set container-runtime containerd
        minikube config set feature-gates "EphemeralContainers=true"
        
        Write-Log "minikube設定が完了しました" "SUCCESS"
        
        # クラスター起動（AMD最適化パラメータ付き）
        Write-Log "Kubernetesクラスターを起動中..." "INFO"
        minikube start --kubernetes-version=v1.28.0 --extra-config=kubelet.housekeeping-interval=10s --extra-config=kubelet.image-gc-high-threshold=85 --extra-config=kubelet.image-gc-low-threshold=80
        
        # 必須アドオン有効化
        minikube addons enable ingress
        minikube addons enable metrics-server
        minikube addons enable dashboard
        
        # クラスター状態確認
        kubectl cluster-info
        kubectl get nodes -o wide
        kubectl get pods --all-namespaces
        
        # minikube詳細状態確認
        minikube status
        minikube profile list
        minikube addons list
        
        Write-Log "Kubernetesクラスターの起動が完了しました" "SUCCESS"
    } catch {
        Write-Log "minikubeの設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
    
    # kubectl設定
    Write-Log "kubectl設定を適用中..." "INFO"
    try {
        # kubectl補完設定（PowerShell用）
        kubectl completion powershell | Out-String | Invoke-Expression
        Write-Log "kubectl補完設定を適用しました" "SUCCESS"
    } catch {
        Write-Log "kubectl補完設定に失敗しました: $($_.Exception.Message)" "WARNING"
    }
}

# Phase 4: 11コンテナ環境構築
function Start-Phase4 {
    Write-Log "=== Phase 4: 11コンテナ環境構築 ===" "SUCCESS"
    
    try {
        # コンテナ構築スクリプト実行
        Write-Log "コンテナ環境構築スクリプトを実行中..." "INFO"
        if (Test-Path ".\setup-containers.ps1") {
            & ".\setup-containers.ps1" -All
            Write-Log "11コンテナ環境構築が完了しました" "SUCCESS"
        } else {
            Write-Log "setup-containers.ps1が見つかりません" "ERROR"
        }
    } catch {
        Write-Log "コンテナ環境構築に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

# Phase 5: リソース監視・最適化
function Start-Phase5 {
    Write-Log "=== Phase 5: リソース監視・最適化 ===" "SUCCESS"
    
    try {
        # 監視・最適化スクリプト実行
        Write-Log "監視・最適化スクリプトを実行中..." "INFO"
        if (Test-Path ".\setup-monitoring.ps1") {
            & ".\setup-monitoring.ps1" -All
            Write-Log "リソース監視・最適化が完了しました" "SUCCESS"
        } else {
            Write-Log "setup-monitoring.ps1が見つかりません" "ERROR"
        }
    } catch {
        Write-Log "監視・最適化に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

# メイン実行部分
if ($Check) {
    Test-Environment
    exit 0
}

if ($All) {
    $Phase1 = $true
    $Phase2 = $true
    $Phase3 = $true
    $Phase4 = $true
    $Phase5 = $true
}

if (-not ($Phase1 -or $Phase2 -or $Phase3 -or $Phase4 -or $Phase5)) {
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  -Phase1    システム基盤セットアップ" -ForegroundColor White
    Write-Host "  -Phase2    パッケージ管理システム構築" -ForegroundColor White
    Write-Host "  -Phase3    Docker & Kubernetes セットアップ" -ForegroundColor White
    Write-Host "  -Phase4    11コンテナ環境構築" -ForegroundColor White
    Write-Host "  -Phase5    リソース監視・最適化" -ForegroundColor White
    Write-Host "  -All       全フェーズ実行" -ForegroundColor White
    Write-Host "  -Check     環境確認のみ" -ForegroundColor White
    Write-Host ""
    Write-Host "例: .\setup-windows11-dev-environment.ps1 -Phase1" -ForegroundColor Green
    exit 0
}

# 環境確認
Test-Environment

# フェーズ実行
if ($Phase1) { Start-Phase1 }
if ($Phase2) { Start-Phase2 }
if ($Phase3) { Start-Phase3 }
if ($Phase4) { Start-Phase4 }
if ($Phase5) { Start-Phase5 }

Write-Log "セットアップが完了しました" "SUCCESS"
Write-Log "ログファイル: $LogFile" "INFO"

if ($Phase1) {
    Write-Log "Phase 1完了後は再起動してください" "WARNING"
    Write-Log "再起動後、以下のコマンドでWSL2設定を続行してください:" "INFO"
    Write-Log "wsl --set-default-version 2" "INFO"
    Write-Log "wsl --install Ubuntu-24.04" "INFO"
}
