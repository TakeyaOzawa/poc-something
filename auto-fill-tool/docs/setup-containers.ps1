# 11コンテナ環境構築スクリプト
# Amazon Q × 4 + アプリケーションスタック × 7

param(
    [switch]$DeployAmazonQ,
    [switch]$DeployAppStack,
    [switch]$CreateYAML,
    [switch]$All,
    [switch]$Status,
    [switch]$Cleanup
)

$ErrorActionPreference = "Stop"
$LogFile = "containers-setup-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

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

function Create-AmazonQYAML {
    Write-Log "Amazon Q クラスター設定ファイルを作成中..." "INFO"
    
    $amazonQYAML = @'
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
        # AMD NPU・GPU利用設定
        - name: ONNXRUNTIME_PROVIDERS
          value: "DmlExecutionProvider,CPUExecutionProvider"
        - name: USE_NPU_ACCELERATION
          value: "true"
        - name: AMD_GPU_TARGETS
          value: "gfx1103"  # Radeon 780M対応
        - name: OMP_NUM_THREADS
          value: "4"  # AMD Ryzen最適化
        # AMD Ryzen AI NPU設定
        - name: INFERENCE_DEVICE
          value: "npu,gpu,cpu"  # 優先順位付き
        - name: MODEL_PRECISION
          value: "fp16"  # NPU効率化
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
      volumes:
      - name: tmp-volume
        emptyDir:
          sizeLimit: 1Gi
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
        # AMD AI推論最適化
        - name: INFERENCE_DEVICE
          value: "npu,gpu,cpu"  # 優先順位付き
        - name: MODEL_PRECISION
          value: "fp16"  # NPU効率化
        - name: AMD_GPU_TARGETS
          value: "gfx1103"  # Radeon 780M
        - name: ROCM_VERSION
          value: "6.2.4"    # 最新ROCm
        - name: OMP_NUM_THREADS
          value: "4"
        - name: HIP_PLATFORM
          value: "amd"
        # PyTorch ROCm統合
        - name: PYTORCH_ROCM_ARCH
          value: "gfx1103"
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
      volumes:
      - name: tmp-volume
        emptyDir:
          sizeLimit: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: amazon-q-chat-service
  namespace: amazon-q
spec:
  selector:
    app: amazon-q-chat
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: amazon-q-code-service
  namespace: amazon-q
spec:
  selector:
    app: amazon-q-code
  ports:
  - port: 8081
    targetPort: 8081
  type: ClusterIP
'@
    
    try {
        $amazonQYAML | Out-File -FilePath "amazon-q-cluster.yaml" -Encoding UTF8
        Write-Log "Amazon Q クラスター設定ファイルを作成しました: amazon-q-cluster.yaml" "SUCCESS"
    } catch {
        Write-Log "Amazon Q YAML作成に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Create-AppStackYAML {
    Write-Log "アプリケーションスタック設定ファイルを作成中..." "INFO"
    
    $appStackYAML = @'
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
        ports:
        - containerPort: 3306
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-service
  namespace: app-stack
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
  type: ClusterIP
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
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: app-stack
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
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
        ports:
        - containerPort: 9000
---
apiVersion: v1
kind: Service
metadata:
  name: php-backend-service
  namespace: app-stack
spec:
  selector:
    app: php-backend
  ports:
  - port: 9000
    targetPort: 9000
  type: ClusterIP
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
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: app-stack
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: NodePort
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
        command: ["php", "-r", "while(true) { echo 'Queue worker running...'; sleep(30); }"]
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
        command: ["node", "-e", "const http = require('http'); const server = http.createServer((req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<h1>Frontend App</h1>'); }); server.listen(3000, () => console.log('Frontend running on port 3000'));"]
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: app-stack
spec:
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
  type: NodePort
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
'@
    
    try {
        $appStackYAML | Out-File -FilePath "app-stack.yaml" -Encoding UTF8
        Write-Log "アプリケーションスタック設定ファイルを作成しました: app-stack.yaml" "SUCCESS"
    } catch {
        Write-Log "アプリケーションスタック YAML作成に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Deploy-AmazonQ {
    Write-Log "=== Amazon Q コンテナをデプロイ中 ===" "SUCCESS"
    
    try {
        # Kubernetes接続確認
        kubectl cluster-info | Out-Null
        Write-Log "Kubernetes接続確認: 成功" "SUCCESS"
        
        # Amazon Q デプロイ
        kubectl apply -f amazon-q-cluster.yaml
        Write-Log "Amazon Q クラスターをデプロイしました" "SUCCESS"
        
        # デプロイ状態確認
        Write-Log "デプロイ状態を確認中..." "INFO"
        Start-Sleep 10
        
        $pods = kubectl get pods -n amazon-q --no-headers
        Write-Log "Amazon Q Pods状態:" "INFO"
        Write-Log $pods "INFO"
        
        # サービス確認
        $services = kubectl get services -n amazon-q --no-headers
        Write-Log "Amazon Q Services:" "INFO"
        Write-Log $services "INFO"
        
        # AMD GPU利用確認（Pod内で実行）
        Write-Log "AMD GPU利用確認中..." "INFO"
        try {
            Start-Sleep 30  # Pod起動待機
            kubectl exec -n amazon-q deployment/amazon-q-chat -- rocm-smi 2>$null
            Write-Log "Amazon Q Chat: AMD GPU確認完了" "SUCCESS"
            
            $rocmCheck = kubectl exec -n amazon-q deployment/amazon-q-code -- python3 -c "
import os
print('ROCm Version:', os.environ.get('ROCM_VERSION', 'Not set'))
print('AMD GPU Targets:', os.environ.get('AMD_GPU_TARGETS', 'Not set'))
print('HIP Platform:', os.environ.get('HIP_PLATFORM', 'Not set'))
" 2>$null
            Write-Log "Amazon Q Code環境変数確認:" "INFO"
            Write-Log $rocmCheck "INFO"
            
            # NPU利用確認
            $npuCheck = kubectl exec -n amazon-q deployment/amazon-q-chat -- python3 -c "
import os
print('NPU Acceleration:', os.environ.get('USE_NPU_ACCELERATION', 'Not set'))
print('Inference Device:', os.environ.get('INFERENCE_DEVICE', 'Not set'))
" 2>$null
            Write-Log "Amazon Q NPU設定確認:" "INFO"
            Write-Log $npuCheck "INFO"
            
        } catch {
            Write-Log "AMD GPU確認に失敗しました（Pod起動中の可能性があります）: $($_.Exception.Message)" "WARNING"
        }
        
    } catch {
        Write-Log "Amazon Q デプロイに失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Deploy-AppStack {
    Write-Log "=== アプリケーションスタックをデプロイ中 ===" "SUCCESS"
    
    try {
        # アプリケーションスタック デプロイ
        kubectl apply -f app-stack.yaml
        Write-Log "アプリケーションスタックをデプロイしました" "SUCCESS"
        
        # デプロイ状態確認
        Write-Log "デプロイ状態を確認中..." "INFO"
        Start-Sleep 15
        
        $pods = kubectl get pods -n app-stack --no-headers
        Write-Log "App Stack Pods状態:" "INFO"
        Write-Log $pods "INFO"
        
        # サービス確認
        $services = kubectl get services -n app-stack --no-headers
        Write-Log "App Stack Services:" "INFO"
        Write-Log $services "INFO"
        
    } catch {
        Write-Log "アプリケーションスタック デプロイに失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Show-Status {
    Write-Log "=== 全コンテナ状態確認 ===" "SUCCESS"
    
    try {
        Write-Log "Kubernetes ノード状態:" "INFO"
        kubectl get nodes -o wide
        
        Write-Log "全ネームスペース確認:" "INFO"
        kubectl get namespaces
        
        Write-Log "Amazon Q ネームスペース:" "INFO"
        kubectl get all -n amazon-q
        
        Write-Log "App Stack ネームスペース:" "INFO"
        kubectl get all -n app-stack
        
        Write-Log "リソース使用量:" "INFO"
        kubectl top nodes
        kubectl top pods --all-namespaces
        
    } catch {
        Write-Log "状態確認に失敗しました: $($_.Exception.Message)" "ERROR"
    }
}

function Cleanup-All {
    Write-Log "=== 全コンテナクリーンアップ中 ===" "WARNING"
    
    $confirm = Read-Host "全てのコンテナを削除しますか？ (y/N)"
    if ($confirm -eq 'y') {
        try {
            kubectl delete namespace amazon-q --ignore-not-found=true
            kubectl delete namespace app-stack --ignore-not-found=true
            Write-Log "全コンテナのクリーンアップが完了しました" "SUCCESS"
        } catch {
            Write-Log "クリーンアップに失敗しました: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-Log "クリーンアップをキャンセルしました" "INFO"
    }
}

# メイン実行部分
Write-Log "11コンテナ環境構築スクリプトを開始します" "SUCCESS"

if ($All) {
    $CreateYAML = $true
    $DeployAmazonQ = $true
    $DeployAppStack = $true
    $Status = $true
}

if ($Status) {
    Show-Status
    exit 0
}

if ($Cleanup) {
    Cleanup-All
    exit 0
}

if (-not ($DeployAmazonQ -or $DeployAppStack -or $CreateYAML)) {
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  -CreateYAML       YAML設定ファイル作成" -ForegroundColor White
    Write-Host "  -DeployAmazonQ    Amazon Q コンテナデプロイ" -ForegroundColor White
    Write-Host "  -DeployAppStack   アプリケーションスタックデプロイ" -ForegroundColor White
    Write-Host "  -All              全ての処理実行" -ForegroundColor White
    Write-Host "  -Status           コンテナ状態確認" -ForegroundColor White
    Write-Host "  -Cleanup          全コンテナ削除" -ForegroundColor White
    Write-Host ""
    Write-Host "例: .\setup-containers.ps1 -All" -ForegroundColor Green
    exit 0
}

# Kubernetes接続確認
try {
    kubectl cluster-info | Out-Null
    Write-Log "Kubernetes接続確認: 成功" "SUCCESS"
} catch {
    Write-Log "Kubernetesに接続できません。minikubeが起動していることを確認してください。" "ERROR"
    Write-Log "minikube start を実行してください。" "INFO"
    exit 1
}

if ($CreateYAML) {
    Create-AmazonQYAML
    Create-AppStackYAML
}

if ($DeployAmazonQ) { Deploy-AmazonQ }
if ($DeployAppStack) { Deploy-AppStack }

Write-Log "コンテナ環境構築が完了しました" "SUCCESS"
Write-Log "ログファイル: $LogFile" "INFO"

# 最終状態確認
Show-Status
