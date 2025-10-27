#!/bin/bash

# 統合テスト

set -e

echo "=== Integration Test Suite ==="

# テスト結果
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo "Running: $test_name"
    if eval "$test_command" > /dev/null 2>&1; then
        echo "✅ $test_name"
        ((TESTS_PASSED++))
    else
        echo "❌ $test_name"
        ((TESTS_FAILED++))
    fi
}

# 基本機能テスト
run_test "AWS CLI availability" "command -v aws"
run_test "Amazon Q CLI availability" "command -v q"
run_test "AWS CLI version" "aws --version"
run_test "Amazon Q CLI version" "q --version"

# ネットワークテスト
run_test "GitHub connectivity" "curl -s --head https://github.com"
run_test "AWS STS connectivity" "curl -s --head https://sts.amazonaws.com"
run_test "Amazon Q connectivity" "curl -s --head https://q.us-east-1.amazonaws.com"

# セキュリティテスト
run_test "Security check" "./.devcontainer/scripts/security-check.sh"
run_test "Health check" "./.devcontainer/scripts/health-check.sh"

# 結果サマリー
echo
echo "=== Test Results ==="
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed!"
    exit 1
fi
