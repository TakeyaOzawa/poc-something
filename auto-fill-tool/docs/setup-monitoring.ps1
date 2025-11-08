# リソース監視・最適化スクリプト
# AMD Ryzen 7 8845HS + 32GB環境専用

param(
    [switch]$InstallMonitoring,
    [switch]$StartMonitoring,
    [switch]$StopMonitoring,
    [switch]$ShowStatus,
    [switch]$OptimizeSystem,
    [switch]$ConfigureSecurity,
    [switch]$CreateScripts,
    [switch]$All
)

$ErrorActionPreference = "Stop"
$LogFile = "monitoring-setup-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

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

function Install-MonitoringTools {
    Write-Log "=== 監視ツールをインストール中 ===" "SUCCESS"
    
    try {
        # Windows Admin Center
        Write-Log "Windows Admin Centerをインストール中..." "INFO"
        winget install Microsoft.WindowsAdminCenter
        Write-Log "Windows Admin Centerのインストールが完了しました" "SUCCESS"
        
        # Process Explorer
        Write-Log "Process Explorerをインストール中..." "INFO"
        winget install Microsoft.Sysinternals.ProcessExplorer
        Write-Log "Process Explorerのインストールが完了しました" "SUCCESS"
        
        # Process Monitor
        Write-Log "Process Monitorをインストール中..." "INFO"
        winget install Microsoft.Sysinternals.ProcessMonitor
        Write-Log "Process Monitorのインストールが完了しました" "SUCCESS"
        
    } catch {
        Write-Log "監視ツールのインストールに失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Get-SystemResources {
    Write-Log "=== AMD Ryzen 7 8845HS システムリソース確認 ===" "SUCCESS"
    
    try {
        # CPU使用率
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
        Write-Log "CPU使用率: $([math]::Round($cpu, 2))%" $(if($cpu -gt 80) {"WARNING"} else {"SUCCESS"})
        
        # メモリ使用状況
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $memoryUsage = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize * 100, 2)
        $availableGB = [math]::Round($memory.FreePhysicalMemory/1MB, 2)
        Write-Log "メモリ使用率: $memoryUsage% (利用可能: $availableGB GB)" $(if($memoryUsage -gt 85) {"WARNING"} else {"SUCCESS"})
        
        # ディスク使用率
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object {$_.DeviceID -eq "C:"}
        $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
        $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
        Write-Log "ディスク使用率: $diskUsage% (空き容量: $freeSpaceGB GB)" $(if($diskUsage -gt 90) {"WARNING"} else {"SUCCESS"})
        
        # AMD CPU情報
        $cpuInfo = Get-WmiObject -Class Win32_Processor
        Write-Log "CPU: $($cpuInfo.Name)" "INFO"
        Write-Log "コア/スレッド: $($cpuInfo.NumberOfCores)/$($cpuInfo.NumberOfLogicalProcessors)" "INFO"
        Write-Log "最大クロック: $($cpuInfo.MaxClockSpeed) MHz" "INFO"
        
        # AMD GPU情報
        $gpu = Get-WmiObject -Class Win32_VideoController | Where-Object {$_.Name -like "*AMD*" -or $_.Name -like "*Radeon*"}
        if ($gpu) {
            Write-Log "GPU: $($gpu.Name)" "INFO"
            $vramGB = [math]::Round($gpu.AdapterRAM / 1GB, 2)
            Write-Log "VRAM: $vramGB GB" "INFO"
        }
        
        # DDR5メモリ速度
        try {
            $memorySpeed = (Get-WmiObject -Class Win32_PhysicalMemory)[0].Speed
            Write-Log "DDR5メモリ速度: $memorySpeed MHz" $(if($memorySpeed -ge 5600) {"SUCCESS"} else {"WARNING"})
        } catch {
            Write-Log "メモリ速度情報を取得できませんでした" "WARNING"
        }
        
        # AMD NPU確認
        Write-Log "AMD NPU・AI Platform確認中..." "INFO"
        try {
            # NPUデバイス確認
            $npuDevice = Get-WmiObject -Class Win32_PnPEntity | Where-Object {$_.Name -like "*NPU*" -or $_.Name -like "*AI*"}
            if ($npuDevice) {
                Write-Log "NPUデバイス: $($npuDevice.Name)" "SUCCESS"
            } else {
                Write-Log "NPUデバイス: 検出されませんでした" "WARNING"
            }
            
            # Windows AI Platform確認
            $aiPlatform = Get-WindowsCapability -Online | Where-Object Name -like "*AI*"
            if ($aiPlatform) {
                Write-Log "Windows AI Platform: 利用可能" "SUCCESS"
                Write-Log "AI Platform状態: $($aiPlatform.State)" "INFO"
            } else {
                Write-Log "Windows AI Platform: 利用不可" "WARNING"
            }
        } catch {
            Write-Log "NPU・AI Platform確認に失敗しました: $($_.Exception.Message)" "WARNING"
        }
        
        # CPU・GPU温度確認（利用可能な場合）
        try {
            $thermalZones = Get-WmiObject -Namespace "root\wmi" -Class "MSAcpi_ThermalZoneTemperature"
            foreach ($zone in $thermalZones) {
                $tempC = [math]::Round(($zone.CurrentTemperature / 10) - 273.15, 1)
                $zoneName = $zone.InstanceName -replace "ACPI\\ThermalZone\\", ""
                Write-Log "温度 ($zoneName): $tempC°C" $(if($tempC -gt 85) {"WARNING"} elseif($tempC -gt 75) {"INFO"} else {"SUCCESS"})
            }
        } catch {
            Write-Log "温度情報を取得できませんでした" "WARNING"
        }
        
    } catch {
        Write-Log "システムリソース確認に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Get-DockerResources {
    Write-Log "=== Docker コンテナリソース確認 ===" "SUCCESS"
    
    try {
        $dockerStats = docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        if ($dockerStats) {
            Write-Log "Docker コンテナ状態:" "INFO"
            Write-Log $dockerStats "INFO"
        } else {
            Write-Log "実行中のDockerコンテナがありません" "INFO"
        }
    } catch {
        Write-Log "Docker情報の取得に失敗しました: $($_.Exception.Message)" "WARNING"
    }
}

function Get-KubernetesResources {
    Write-Log "=== Kubernetes リソース確認 ===" "SUCCESS"
    
    try {
        Write-Log "Kubernetesノード状態:" "INFO"
        kubectl top nodes
        
        Write-Log "Pod リソース使用量:" "INFO"
        kubectl top pods --all-namespaces
        
    } catch {
        Write-Log "Kubernetes情報の取得に失敗しました: $($_.Exception.Message)" "WARNING"
    }
}

function Create-MonitoringScript {
    Write-Log "監視スクリプトを作成中..." "INFO"
    
    $monitoringScript = @'
# AMD Ryzen 7 8845HS専用リソース監視スクリプト
param(
    [int]$IntervalSeconds = 300,  # 5分間隔
    [int]$CpuThreshold = 80,
    [int]$MemoryThreshold = 85,
    [int]$DiskThreshold = 90
)

function Send-WindowsNotification {
    param(
        [string]$Title = "System Monitor",
        [string]$Message,
        [string]$Icon = "Info"
    )
    
    Add-Type -AssemblyName System.Windows.Forms
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

function Write-MonitoringEvent {
    param(
        [string]$Source = "DevEnvironment",
        [int]$EventId = 1001,
        [string]$Message,
        [string]$Level = "Information"
    )
    
    try {
        Write-EventLog -LogName Application -Source $Source -EventId $EventId -Message $Message -EntryType $Level
        
        if ($Level -eq "Warning" -or $Level -eq "Error") {
            Send-WindowsNotification -Title "System Alert" -Message $Message -Icon $Level
        }
    } catch {
        Write-Host "Event log write failed: $($_.Exception.Message)"
    }
}

Write-Host "AMD Ryzen 7 8845HS システム監視を開始します..." -ForegroundColor Green
Write-Host "閾値: CPU $CpuThreshold%, メモリ $MemoryThreshold%, ディスク $DiskThreshold%" -ForegroundColor Yellow

while ($true) {
    try {
        # CPU使用率チェック
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
        if ($cpu -gt $CpuThreshold) {
            $message = "CPU使用率が $([math]::Round($cpu, 2))% です (閾値: $CpuThreshold%)"
            Write-MonitoringEvent -Message $message -Level "Warning"
        }
        
        # メモリ使用率チェック
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $memoryUsage = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize * 100, 2)
        if ($memoryUsage -gt $MemoryThreshold) {
            $message = "メモリ使用率が $memoryUsage% です (閾値: $MemoryThreshold%)"
            Write-MonitoringEvent -Message $message -Level "Warning"
        }
        
        # ディスク使用率チェック
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object {$_.DeviceID -eq "C:"}
        $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
        if ($diskUsage -gt $DiskThreshold) {
            $message = "ディスク使用率が $diskUsage% です (閾値: $DiskThreshold%)"
            Write-MonitoringEvent -Message $message -Level "Warning"
        }
        
        # Docker コンテナチェック
        try {
            $dockerStats = docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemPerc}}" 2>$null
            if ($dockerStats) {
                foreach ($stat in $dockerStats) {
                    $parts = $stat.Split(',')
                    $containerName = $parts[0]
                    $containerCpu = [float]($parts[1] -replace '%', '')
                    $containerMem = [float]($parts[2] -replace '%', '')
                    
                    if ($containerCpu -gt 90 -or $containerMem -gt 90) {
                        $message = "コンテナ $containerName: CPU $containerCpu%, メモリ $containerMem%"
                        Write-MonitoringEvent -Message $message -Level "Warning"
                    }
                }
            }
        } catch {
            # Docker未起動時は無視
        }
        
        Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - 監視チェック完了" -ForegroundColor Gray
        
    } catch {
        Write-Host "監視エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds $IntervalSeconds
}
'@
    
    try {
        $monitoringScript | Out-File -FilePath "monitor-resources.ps1" -Encoding UTF8
        Write-Log "監視スクリプトを作成しました: monitor-resources.ps1" "SUCCESS"
    } catch {
        Write-Log "監視スクリプトの作成に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Register-MonitoringTask {
    Write-Log "監視タスクをタスクスケジューラーに登録中..." "INFO"
    
    try {
        $taskName = "AMD-SystemMonitoring"
        $scriptPath = "$PWD\monitor-resources.ps1"
        
        # 既存タスクを削除
        try {
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        } catch {
            # 既存タスクがない場合は無視
        }
        
        # 新しいタスクを作成
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "AMD Ryzen 7 8845HS system monitoring"
        
        Write-Log "監視タスクを登録しました: $taskName" "SUCCESS"
    } catch {
        Write-Log "監視タスクの登録に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Start-MonitoringTask {
    Write-Log "監視タスクを開始中..." "INFO"
    
    try {
        Start-ScheduledTask -TaskName "AMD-SystemMonitoring"
        Write-Log "監視タスクを開始しました" "SUCCESS"
    } catch {
        Write-Log "監視タスクの開始に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Stop-MonitoringTask {
    Write-Log "監視タスクを停止中..." "INFO"
    
    try {
        Stop-ScheduledTask -TaskName "AMD-SystemMonitoring"
        Write-Log "監視タスクを停止しました" "SUCCESS"
    } catch {
        Write-Log "監視タスクの停止に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Optimize-System {
    Write-Log "=== システム最適化を実行中 ===" "SUCCESS"
    
    try {
        # 電源プラン設定
        Write-Log "電源プランを高パフォーマンスに設定中..." "INFO"
        $schemes = powercfg /list
        if ($schemes -match "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c") {
            powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
            Write-Log "高パフォーマンス電源プランに設定しました" "SUCCESS"
        } else {
            Write-Log "高パフォーマンス電源プランが見つかりません" "WARNING"
        }
        
        # 不要サービス停止
        Write-Log "不要サービスを停止中..." "INFO"
        $servicesToStop = @("Fax", "XblAuthManager", "XblGameSave")
        foreach ($service in $servicesToStop) {
            try {
                Stop-Service $service -ErrorAction SilentlyContinue
                Set-Service $service -StartupType Disabled -ErrorAction SilentlyContinue
                Write-Log "サービス停止: $service" "SUCCESS"
            } catch {
                Write-Log "サービス停止失敗: $service" "WARNING"
            }
        }
        
        # 視覚効果最適化
        Write-Log "視覚効果を最適化中..." "INFO"
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" -Name "VisualFXSetting" -Value 2
        
        # ファイルシステム最適化
        Write-Log "ファイルシステムを最適化中..." "INFO"
        fsutil behavior set memoryusage 2
        
        Write-Log "システム最適化が完了しました" "SUCCESS"
        
    } catch {
        Write-Log "システム最適化に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Configure-Security {
    Write-Log "=== セキュリティ設定を適用中 ===" "SUCCESS"
    
    try {
        # ファイアウォール設定
        Write-Log "Windows Defender Firewall設定を適用中..." "INFO"
        
        # 開発用ポートのみ許可
        $firewallRules = @(
            @{Name="Kubernetes API"; Port=8443; Protocol="TCP"},
            @{Name="Docker API"; Port=2376; Protocol="TCP"},
            @{Name="Grafana Dashboard"; Port=3000; Protocol="TCP"}
        )
        
        foreach ($rule in $firewallRules) {
            try {
                New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol $rule.Protocol -LocalPort $rule.Port -Action Allow -ErrorAction SilentlyContinue
                Write-Log "ファイアウォールルール追加: $($rule.Name)" "SUCCESS"
            } catch {
                Write-Log "ファイアウォールルール追加失敗: $($rule.Name)" "WARNING"
            }
        }
        
        # 不要なポートをブロック
        $blockRules = @(
            @{Name="Block Telnet"; Port=23},
            @{Name="Block FTP"; Port=21},
            @{Name="Block SMB"; Port=445}
        )
        
        foreach ($rule in $blockRules) {
            try {
                New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Block -ErrorAction SilentlyContinue
                Write-Log "ブロックルール追加: $($rule.Name)" "SUCCESS"
            } catch {
                Write-Log "ブロックルール追加失敗: $($rule.Name)" "WARNING"
            }
        }
        
        # DNS設定（Cloudflare DNS - マルウェアブロック付き）
        Write-Log "DNS設定を適用中..." "INFO"
        try {
            netsh interface ip set dns "Wi-Fi" static 1.1.1.2
            netsh interface ip add dns "Wi-Fi" 1.0.0.2 index=2
            Write-Log "Cloudflare DNS（マルウェアブロック付き）を設定しました" "SUCCESS"
        } catch {
            Write-Log "DNS設定に失敗しました: $($_.Exception.Message)" "WARNING"
        }
        
        Write-Log "セキュリティ設定が完了しました" "SUCCESS"
        
    } catch {
        Write-Log "セキュリティ設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Create-BackupScript {
    Write-Log "バックアップスクリプトを作成中..." "INFO"
    
    $backupScript = @'
# 設定バックアップスクリプト
param(
    [string]$BackupPath = "C:\Backup\DevEnvironment\$(Get-Date -Format 'yyyyMMdd')"
)

Write-Host "バックアップを開始します: $BackupPath" -ForegroundColor Green
New-Item -ItemType Directory -Path $BackupPath -Force

try {
    # Kubernetes設定
    Write-Host "Kubernetes設定をバックアップ中..." -ForegroundColor Yellow
    kubectl get all --all-namespaces -o yaml > "$BackupPath\k8s-resources.yaml"
    
    # Docker Compose設定
    Write-Host "Docker設定をバックアップ中..." -ForegroundColor Yellow
    if (Test-Path "C:\workspace\docker-compose.yml") {
        Copy-Item "C:\workspace\docker-compose.yml" "$BackupPath\"
    }
    
    # パッケージリスト
    Write-Host "パッケージリストをバックアップ中..." -ForegroundColor Yellow
    winget export -o "$BackupPath\winget-packages.json"
    choco list --local-only > "$BackupPath\choco-packages.txt"
    
    # WSL2設定
    Write-Host "WSL2設定をバックアップ中..." -ForegroundColor Yellow
    if (Test-Path "$env:USERPROFILE\.wslconfig") {
        Copy-Item "$env:USERPROFILE\.wslconfig" "$BackupPath\"
    }
    
    # Docker Desktop設定
    Write-Host "Docker Desktop設定をバックアップ中..." -ForegroundColor Yellow
    if (Test-Path "$env:APPDATA\Docker\settings.json") {
        Copy-Item "$env:APPDATA\Docker\settings.json" "$BackupPath\"
    }
    
    Write-Host "バックアップが完了しました: $BackupPath" -ForegroundColor Green
    
} catch {
    Write-Host "バックアップエラー: $($_.Exception.Message)" -ForegroundColor Red
}
'@
    
    try {
        $backupScript | Out-File -FilePath "backup-config.ps1" -Encoding UTF8
        Write-Log "バックアップスクリプトを作成しました: backup-config.ps1" "SUCCESS"
    } catch {
        Write-Log "バックアップスクリプトの作成に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Create-MaintenanceScript {
    Write-Log "メンテナンススクリプトを作成中..." "INFO"
    
    $maintenanceScript = @'
# 日次メンテナンススクリプト
param(
    [switch]$UpdatePackages,
    [switch]$CleanupDocker,
    [switch]$RestartServices,
    [switch]$All
)

if ($All) {
    $UpdatePackages = $true
    $CleanupDocker = $true
    $RestartServices = $true
}

function Update-AllPackages {
    Write-Host "パッケージを更新中..." -ForegroundColor Yellow
    try {
        winget upgrade --all --silent
        choco upgrade all -y
        Write-Host "パッケージ更新が完了しました" -ForegroundColor Green
    } catch {
        Write-Host "パッケージ更新に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Cleanup-DockerResources {
    Write-Host "Dockerリソースをクリーンアップ中..." -ForegroundColor Yellow
    try {
        docker system prune -f
        docker volume prune -f
        docker image prune -a -f
        Write-Host "Dockerクリーンアップが完了しました" -ForegroundColor Green
    } catch {
        Write-Host "Dockerクリーンアップに失敗しました: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Restart-KubernetesServices {
    Write-Host "Kubernetesサービスを再起動中..." -ForegroundColor Yellow
    try {
        kubectl rollout restart deployment -n amazon-q
        kubectl rollout restart deployment -n app-stack
        Write-Host "Kubernetesサービス再起動が完了しました" -ForegroundColor Green
    } catch {
        Write-Host "Kubernetesサービス再起動に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "日次メンテナンスを開始します" -ForegroundColor Cyan

if ($UpdatePackages) { Update-AllPackages }
if ($CleanupDocker) { Cleanup-DockerResources }
if ($RestartServices) { Restart-KubernetesServices }

Write-Host "メンテナンスが完了しました!" -ForegroundColor Green
'@
    
    try {
        $maintenanceScript | Out-File -FilePath "daily-maintenance.ps1" -Encoding UTF8
        Write-Log "メンテナンススクリプトを作成しました: daily-maintenance.ps1" "SUCCESS"
    } catch {
        Write-Log "メンテナンススクリプトの作成に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

# メイン実行部分
Write-Log "リソース監視・最適化スクリプトを開始します" "SUCCESS"

if ($All) {
    $InstallMonitoring = $true
    $OptimizeSystem = $true
    $ConfigureSecurity = $true
    $CreateScripts = $true
    $ShowStatus = $true
}

if (-not ($InstallMonitoring -or $StartMonitoring -or $StopMonitoring -or $ShowStatus -or $OptimizeSystem -or $ConfigureSecurity -or $CreateScripts)) {
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  -InstallMonitoring   監視ツールインストール" -ForegroundColor White
    Write-Host "  -StartMonitoring     監視開始" -ForegroundColor White
    Write-Host "  -StopMonitoring      監視停止" -ForegroundColor White
    Write-Host "  -ShowStatus          システム状態表示" -ForegroundColor White
    Write-Host "  -OptimizeSystem      システム最適化" -ForegroundColor White
    Write-Host "  -ConfigureSecurity   セキュリティ設定" -ForegroundColor White
    Write-Host "  -CreateScripts       バックアップ・メンテナンススクリプト作成" -ForegroundColor White
    Write-Host "  -All                 全ての処理実行" -ForegroundColor White
    Write-Host ""
    Write-Host "例: .\setup-monitoring.ps1 -All" -ForegroundColor Green
    exit 0
}

if ($InstallMonitoring) {
    Install-MonitoringTools
    Create-MonitoringScript
    Register-MonitoringTask
}

if ($StartMonitoring) { Start-MonitoringTask }
if ($StopMonitoring) { Stop-MonitoringTask }
if ($OptimizeSystem) { Optimize-System }
if ($ConfigureSecurity) { Configure-Security }
if ($CreateScripts) { 
    Create-BackupScript
    Create-MaintenanceScript
}

if ($ShowStatus) {
    Get-SystemResources
    Get-DockerResources
    Get-KubernetesResources
}

Write-Log "リソース監視・最適化設定が完了しました" "SUCCESS"
Write-Log "ログファイル: $LogFile" "INFO"
