# WSL2 + Ubuntu 24.04 設定スクリプト
# Phase 1完了後の再起動後に実行
# AMD Ryzen 7 8845HS + Radeon 780M最適化

param(
    [switch]$InstallUbuntu,
    [switch]$ConfigureWSL,
    [switch]$SetupROCm,
    [switch]$InstallDevTools,
    [switch]$SetupSSH,
    [switch]$All
)

$ErrorActionPreference = "Stop"
$LogFile = "wsl2-setup-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

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

function Install-Ubuntu {
    Write-Log "=== Ubuntu 24.04 LTSをインストール中 ===" "SUCCESS"
    
    # WSL2をデフォルトバージョンに設定
    try {
        wsl --set-default-version 2
        Write-Log "WSL2をデフォルトバージョンに設定しました" "SUCCESS"
    } catch {
        Write-Log "WSL2デフォルト設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
    
    # Ubuntu 24.04インストール
    try {
        Write-Log "Ubuntu 24.04 LTSをインストール中..." "INFO"
        wsl --install Ubuntu-24.04
        Write-Log "Ubuntu 24.04 LTSのインストールが完了しました" "SUCCESS"
        Write-Log "初回起動時にユーザー名とパスワードを設定してください" "INFO"
    } catch {
        Write-Log "Ubuntu 24.04のインストールに失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Configure-WSL {
    Write-Log "=== WSL2設定ファイルを作成中 ===" "SUCCESS"
    
    $wslConfigPath = "$env:USERPROFILE\.wslconfig"
    $wslConfig = @"
[wsl2]
memory=16GB
processors=8
swap=4GB
localhostForwarding=true
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1

# AMD Ryzen 7 8845HS最適化設定
nestedVirtualization=true
vmIdleTimeout=60000

# AMD Radeon 780M GPU統合設定
[experimental]
autoMemoryReclaim=gradual
sparseVhd=true
"@
    
    try {
        $wslConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8
        Write-Log "WSL2設定ファイルを作成しました: $wslConfigPath" "SUCCESS"
        Write-Log "設定を反映するためWSL2を再起動します..." "INFO"
        wsl --shutdown
        Start-Sleep 5
        Write-Log "WSL2の再起動が完了しました" "SUCCESS"
    } catch {
        Write-Log "WSL2設定ファイルの作成に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Setup-ROCm {
    Write-Log "=== Ubuntu内でAMD ROCm設定を実行中 ===" "SUCCESS"
    
    $rocmSetupScript = @'
#!/bin/bash
set -e

echo "システム更新中..."
sudo apt update && sudo apt upgrade -y

echo "AMD GPUリポジトリ追加中..."
wget -q -O - https://repo.radeon.com/rocm/rocm.gpg.key | sudo apt-key add -
echo 'deb [arch=amd64] https://repo.radeon.com/rocm/apt/6.2.4/ubuntu noble main' | sudo tee /etc/apt/sources.list.d/rocm.list

echo "ROCm 6.2.4インストール中..."
sudo apt update
sudo apt install rocm-dev rocm-libs hip-dev rocm-device-libs -y

echo "環境変数設定中..."
echo 'export PATH=/opt/rocm/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/opt/rocm/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
echo 'export HIP_PLATFORM=amd' >> ~/.bashrc
echo 'export ROCM_VERSION=6.2.4' >> ~/.bashrc

echo "ユーザーをrenderグループに追加中..."
sudo usermod -a -G render,video $USER

echo "Node.js 22 LTS設定中..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "npm最新版に更新中..."
sudo npm install -g npm@latest

echo "Python 3.12設定中..."
sudo apt install python3.12 python3.12-venv python3.12-pip python3.12-dev -y
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1

echo "開発ツール設定中..."
pip3 install --upgrade pip setuptools wheel build

echo "AMD ROCm Python統合中..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.2

echo "Docker Compose最新版インストール中..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "kubectl最新版インストール中..."
curl -LO "https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

echo "Helm最新版インストール中..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "追加開発ツールインストール中..."
pip3 install black==23.12.1 isort==5.13.2 flake8==7.0.0 mypy==1.8.0 pytest==7.4.3 jupyter==1.0.0 notebook==7.0.6
npm install -g typescript@5.3.3 @types/node@20.10.5 eslint@8.56.0 prettier@3.1.1

echo "Git設定（Ubuntu内）..."
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global url."git@github.com:".insteadOf "https://github.com/"

echo "ROCm設定が完了しました"
'@
    
    try {
        # スクリプトファイルを一時的に作成
        $tempScript = "$env:TEMP\rocm-setup.sh"
        $rocmSetupScript | Out-File -FilePath $tempScript -Encoding UTF8
        
        # WSL内でスクリプト実行
        Write-Log "Ubuntu内でROCm設定スクリプトを実行中..." "INFO"
        wsl -d Ubuntu-24.04 -e bash -c "cat > /tmp/rocm-setup.sh && chmod +x /tmp/rocm-setup.sh && /tmp/rocm-setup.sh" < $tempScript
        
        # 一時ファイル削除
        Remove-Item $tempScript -Force
        
        Write-Log "ROCm設定が完了しました" "SUCCESS"
    } catch {
        Write-Log "ROCm設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Setup-SSH {
    Write-Log "=== SSH設定を実行中 ===" "SUCCESS"
    
    try {
        # SSH鍵生成（Windows側）
        Write-Log "SSH鍵を生成中..." "INFO"
        $sshDir = "$env:USERPROFILE\.ssh"
        if (-not (Test-Path $sshDir)) {
            New-Item -ItemType Directory -Path $sshDir -Force
        }
        
        $keyPath = "$sshDir\id_ed25519"
        if (-not (Test-Path $keyPath)) {
            $email = Read-Host "GitHubで使用するメールアドレスを入力してください"
            ssh-keygen -t ed25519 -C $email -f $keyPath -N '""'
            Write-Log "SSH鍵を生成しました: $keyPath" "SUCCESS"
        } else {
            Write-Log "SSH鍵は既に存在します: $keyPath" "INFO"
        }
        
        # SSH Agent起動・鍵追加
        Write-Log "SSH Agentを設定中..." "INFO"
        Start-Service ssh-agent -ErrorAction SilentlyContinue
        Set-Service -Name ssh-agent -StartupType Automatic -ErrorAction SilentlyContinue
        ssh-add $keyPath
        
        # 公開鍵をクリップボードにコピー
        Get-Content "$keyPath.pub" | Set-Clipboard
        Write-Log "公開鍵をクリップボードにコピーしました" "SUCCESS"
        Write-Log "GitHub > Settings > SSH and GPG keys で公開鍵を登録してください" "INFO"
        
        # Git設定（Windows側）
        Write-Log "Git設定を適用中..." "INFO"
        $userName = Read-Host "Gitユーザー名を入力してください"
        $userEmail = Read-Host "Gitメールアドレスを入力してください"
        
        git config --global user.name $userName
        git config --global user.email $userEmail
        git config --global url."git@github.com:".insteadOf "https://github.com/"
        git config --global init.defaultBranch main
        git config --global pull.rebase false
        
        Write-Log "Git設定が完了しました" "SUCCESS"
        Write-Log "接続テスト: ssh -T git@github.com を実行してください" "INFO"
        
    } catch {
        Write-Log "SSH設定に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Install-DevTools {
    Write-Log "=== 開発ツールバージョン確認中 ===" "SUCCESS"
    
    try {
        Write-Log "Node.js バージョン確認..." "INFO"
        $nodeVersion = wsl -d Ubuntu-24.04 -e node --version
        Write-Log "Node.js: $nodeVersion" "SUCCESS"
        
        Write-Log "npm バージョン確認..." "INFO"
        $npmVersion = wsl -d Ubuntu-24.04 -e npm --version
        Write-Log "npm: $npmVersion" "SUCCESS"
        
        Write-Log "Python バージョン確認..." "INFO"
        $pythonVersion = wsl -d Ubuntu-24.04 -e python3 --version
        Write-Log "Python: $pythonVersion" "SUCCESS"
        
        Write-Log "kubectl バージョン確認..." "INFO"
        $kubectlVersion = wsl -d Ubuntu-24.04 -e kubectl version --client
        Write-Log "kubectl: $kubectlVersion" "SUCCESS"
        
        Write-Log "Helm バージョン確認..." "INFO"
        $helmVersion = wsl -d Ubuntu-24.04 -e helm version
        Write-Log "Helm: $helmVersion" "SUCCESS"
        
        Write-Log "Docker Compose バージョン確認..." "INFO"
        $composeVersion = wsl -d Ubuntu-24.04 -e docker-compose --version
        Write-Log "Docker Compose: $composeVersion" "SUCCESS"
        
        Write-Log "Git バージョン確認..." "INFO"
        $gitVersion = wsl -d Ubuntu-24.04 -e git --version
        Write-Log "Git: $gitVersion" "SUCCESS"
        
    } catch {
        Write-Log "開発ツールの確認に失敗しました: $($_.Exception.Message)" "WARNING"
    }
    
    # AMD GPU・ROCm動作確認
    Write-Log "AMD GPU・ROCm動作確認中..." "INFO"
    try {
        # ROCm SMI確認
        Write-Log "ROCm SMI確認..." "INFO"
        wsl -d Ubuntu-24.04 -e rocm-smi
        
        # ROCm情報確認
        Write-Log "ROCm情報確認..." "INFO"
        wsl -d Ubuntu-24.04 -e rocminfo
        
        # HIP設定確認
        Write-Log "HIP設定確認..." "INFO"
        wsl -d Ubuntu-24.04 -e hipconfig --version
        
        Write-Log "AMD GPU・ROCm確認完了" "SUCCESS"
    } catch {
        Write-Log "AMD GPU・ROCm確認に失敗しました: $($_.Exception.Message)" "WARNING"
    }
    
    # AMD GPU + PyTorch動作確認
    Write-Log "AMD GPU + PyTorch動作確認中..." "INFO"
    try {
        $pytorchTest = @'
import torch
print(f'PyTorch version: {torch.__version__}')
print(f'ROCm available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'GPU device: {torch.cuda.get_device_name(0)}')
    print(f'GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
else:
    print('ROCm not available - CPU only mode')
'@
        
        $result = wsl -d Ubuntu-24.04 -e python3 -c $pytorchTest
        Write-Log "PyTorch + ROCm テスト結果:" "SUCCESS"
        Write-Log $result "INFO"
    } catch {
        Write-Log "PyTorch + ROCm テストに失敗しました: $($_.Exception.Message)" "WARNING"
    }
}

# メイン実行部分
Write-Log "WSL2 + Ubuntu 24.04 設定スクリプトを開始します" "SUCCESS"

if ($All) {
    $InstallUbuntu = $true
    $ConfigureWSL = $true
    $SetupROCm = $true
    $InstallDevTools = $true
    $SetupSSH = $true
}

if (-not ($InstallUbuntu -or $ConfigureWSL -or $SetupROCm -or $InstallDevTools -or $SetupSSH)) {
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  -InstallUbuntu    Ubuntu 24.04 LTSインストール" -ForegroundColor White
    Write-Host "  -ConfigureWSL     WSL2設定ファイル作成" -ForegroundColor White
    Write-Host "  -SetupROCm        AMD ROCm設定" -ForegroundColor White
    Write-Host "  -InstallDevTools  開発ツール確認" -ForegroundColor White
    Write-Host "  -SetupSSH         SSH・Git設定" -ForegroundColor White
    Write-Host "  -All              全ての設定実行" -ForegroundColor White
    Write-Host ""
    Write-Host "例: .\setup-wsl2-ubuntu.ps1 -All" -ForegroundColor Green
    exit 0
}

# WSL2機能確認
try {
    $wslStatus = wsl --status
    Write-Log "WSL2状態確認: 成功" "SUCCESS"
} catch {
    Write-Log "WSL2が有効化されていません。Phase 1を実行して再起動してください。" "ERROR"
    exit 1
}

if ($InstallUbuntu) { Install-Ubuntu }
if ($ConfigureWSL) { Configure-WSL }
if ($SetupROCm) { Setup-ROCm }
if ($InstallDevTools) { Install-DevTools }
if ($SetupSSH) { Setup-SSH }

Write-Log "WSL2 + Ubuntu 24.04 設定が完了しました" "SUCCESS"
Write-Log "ログファイル: $LogFile" "INFO"

Write-Log "次のステップ:" "INFO"
Write-Log "1. Ubuntu 24.04を起動してユーザー設定を完了してください" "INFO"
Write-Log "2. setup-windows11-dev-environment.ps1 -Phase3 を実行してください" "INFO"
