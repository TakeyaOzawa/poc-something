#!/bin/bash

# Integrated Error Code Management and Testing Script
# All error code operations in one lightweight shell script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCALES_DIR="$PROJECT_ROOT/public/_locales"
EN_MESSAGES_PATH="$LOCALES_DIR/en/messages.json"
JA_MESSAGES_PATH="$LOCALES_DIR/ja/messages.json"
SRC_DIR="$PROJECT_ROOT/src"
DOCS_DIR="$PROJECT_ROOT/docs"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${CYAN}📋 $1${NC}"
}

# Load messages from JSON file
load_messages() {
    local file_path="$1"
    if [ ! -f "$file_path" ]; then
        echo "{}"
        return
    fi
    cat "$file_path"
}

# Extract error codes from messages
extract_error_codes() {
    local messages="$1"
    echo "$messages" | jq -r 'keys[]' | grep -E '^E_[A-Z_]+_[0-9]+_(USER|DEV|RESOLUTION)$' | \
    sed 's/_\(USER\|DEV\|RESOLUTION\)$//' | sort -u
}

# Extract StandardError usage from TypeScript files
extract_used_error_codes() {
    local src_dir="$1"
    find "$src_dir" -name "*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*" -not -name "*.test.ts" | \
    xargs grep -h "new StandardError(" 2>/dev/null | \
    sed -n "s/.*new StandardError(['\"]\\([^'\"]*\\)['\"].*/\\1/p" | \
    sort -u
}

# Find next available error code for category
find_next_code() {
    local messages="$1"
    local category="$2"
    local prefix="E_${category}_"
    
    local existing_numbers
    existing_numbers=$(echo "$messages" | jq -r 'keys[]' | grep "^${prefix}[0-9]\\+_" | \
    sed "s/^${prefix}\\([0-9]\\+\\)_.*/\\1/" | sort -n)
    
    local next_number=1
    while IFS= read -r num; do
        [ -z "$num" ] && continue
        if [ "$num" -eq "$next_number" ]; then
            next_number=$((next_number + 1))
        else
            break
        fi
    done <<< "$existing_numbers"
    
    printf "%s%04d" "$prefix" "$next_number"
}

# Get category-specific templates
get_category_templates() {
    local category="$1"
    local error_code="$2"
    
    case "$category" in
        "XPATH")
            echo "en_user:[TODO] XPath operation failed"
            echo "en_dev:[TODO] XPath selector error in $error_code"
            echo "en_resolution:[TODO] Check XPath selector or wait for element to load"
            echo "ja_user:[TODO] XPath操作が失敗しました"
            echo "ja_dev:[TODO] ${error_code}でXPathセレクターエラー"
            echo "ja_resolution:[TODO] XPathセレクターを確認するか、要素の読み込み完了を待ってください"
            ;;
        "AUTH")
            echo "en_user:[TODO] Authentication failed"
            echo "en_dev:[TODO] Authentication error in $error_code"
            echo "en_resolution:[TODO] Check credentials or authentication settings"
            echo "ja_user:[TODO] 認証に失敗しました"
            echo "ja_dev:[TODO] ${error_code}で認証エラー"
            echo "ja_resolution:[TODO] 認証情報または認証設定を確認してください"
            ;;
        "USER")
            echo "en_user:[TODO] User operation failed"
            echo "en_dev:[TODO] User management error in $error_code"
            echo "en_resolution:[TODO] Check user permissions or input data"
            echo "ja_user:[TODO] ユーザー操作が失敗しました"
            echo "ja_dev:[TODO] ${error_code}でユーザー管理エラー"
            echo "ja_resolution:[TODO] ユーザー権限または入力データを確認してください"
            ;;
        "STORAGE")
            echo "en_user:[TODO] Storage operation failed"
            echo "en_dev:[TODO] Storage access error in $error_code"
            echo "en_resolution:[TODO] Check storage permissions or available space"
            echo "ja_user:[TODO] ストレージ操作が失敗しました"
            echo "ja_dev:[TODO] ${error_code}でストレージアクセスエラー"
            echo "ja_resolution:[TODO] ストレージ権限または利用可能容量を確認してください"
            ;;
        "SYNC")
            echo "en_user:[TODO] Synchronization failed"
            echo "en_dev:[TODO] Data sync error in $error_code"
            echo "en_resolution:[TODO] Check network connection or sync configuration"
            echo "ja_user:[TODO] 同期に失敗しました"
            echo "ja_dev:[TODO] ${error_code}でデータ同期エラー"
            echo "ja_resolution:[TODO] ネットワーク接続または同期設定を確認してください"
            ;;
        *)
            echo "en_user:[TODO] ${category} operation failed"
            echo "en_dev:[TODO] ${category} error in $error_code"
            echo "en_resolution:[TODO] Check ${category,,} configuration or input"
            echo "ja_user:[TODO] ${category}操作が失敗しました"
            echo "ja_dev:[TODO] ${error_code}で${category}エラー"
            echo "ja_resolution:[TODO] ${category,,}設定または入力を確認してください"
            ;;
    esac
}

# List all error codes
list_error_codes() {
    log_header "Error Codes List"
    echo ""
    
    local en_messages
    en_messages=$(load_messages "$EN_MESSAGES_PATH")
    
    local error_codes
    error_codes=$(extract_error_codes "$en_messages")
    
    if [ -z "$error_codes" ]; then
        echo "No error codes found."
        return
    fi
    
    # Group by category
    local current_category=""
    while IFS= read -r code; do
        [ -z "$code" ] && continue
        
        local category
        category=$(echo "$code" | sed 's/^E_\([A-Z_]*\)_[0-9]*/\1/')
        
        if [ "$category" != "$current_category" ]; then
            echo ""
            echo -e "${CYAN}🏷️  $category:${NC}"
            current_category="$category"
        fi
        
        local user_key="${code}_USER"
        local dev_key="${code}_DEV"
        local resolution_key="${code}_RESOLUTION"
        
        echo -e "  ${YELLOW}$code${NC}:"
        
        # USER message
        local user_msg
        user_msg=$(echo "$en_messages" | jq -r ".\"$user_key\".message // empty" 2>/dev/null)
        if [ -n "$user_msg" ] && [ "$user_msg" != "null" ]; then
            echo -e "    ${GREEN}✅ USER${NC}: $user_msg"
        else
            echo -e "    ${RED}❌ USER${NC}: ${RED}(not set)${NC}"
        fi
        
        # DEV message
        local dev_msg
        dev_msg=$(echo "$en_messages" | jq -r ".\"$dev_key\".message // empty" 2>/dev/null)
        if [ -n "$dev_msg" ] && [ "$dev_msg" != "null" ]; then
            echo -e "    ${GREEN}✅ DEV${NC}: $dev_msg"
        else
            echo -e "    ${RED}❌ DEV${NC}: ${RED}(not set)${NC}"
        fi
        
        # RESOLUTION message
        local res_msg
        res_msg=$(echo "$en_messages" | jq -r ".\"$resolution_key\".message // empty" 2>/dev/null)
        if [ -n "$res_msg" ] && [ "$res_msg" != "null" ]; then
            echo -e "    ${GREEN}✅ RES${NC}: $res_msg"
        else
            echo -e "    ${RED}❌ RES${NC}: ${RED}(not set)${NC}"
        fi
        
        echo ""
    done <<< "$error_codes"
    
    local total_count
    total_count=$(echo "$error_codes" | wc -l)
    echo ""
    echo "📊 Total: $total_count error codes"
}

# Reserve new error code
reserve_error_code() {
    local category="$1"
    
    if [ -z "$category" ]; then
        log_error "Usage: $0 reserve <category>"
        echo "   Examples:"
        echo "     $0 reserve XPATH"
        echo "     $0 reserve AUTH"
        echo "     $0 reserve USER"
        echo "     $0 reserve STORAGE"
        echo "     $0 reserve SYNC"
        return 1
    fi
    
    # Validate category format
    if ! echo "$category" | grep -q '^[A-Z_]\+$'; then
        log_error "Category must contain only uppercase letters and underscores"
        echo "   Valid examples: XPATH, AUTH, USER_MANAGEMENT, STORAGE_SYNC"
        return 1
    fi
    
    local en_messages
    en_messages=$(load_messages "$EN_MESSAGES_PATH")
    local ja_messages
    ja_messages=$(load_messages "$JA_MESSAGES_PATH")
    
    local new_code
    new_code=$(find_next_code "$en_messages" "$category")
    
    # Get templates
    local templates
    templates=$(get_category_templates "$category" "$new_code")
    
    local en_user en_dev en_resolution ja_user ja_dev ja_resolution
    en_user=$(echo "$templates" | grep "^en_user:" | cut -d: -f2-)
    en_dev=$(echo "$templates" | grep "^en_dev:" | cut -d: -f2-)
    en_resolution=$(echo "$templates" | grep "^en_resolution:" | cut -d: -f2-)
    ja_user=$(echo "$templates" | grep "^ja_user:" | cut -d: -f2-)
    ja_dev=$(echo "$templates" | grep "^ja_dev:" | cut -d: -f2-)
    ja_resolution=$(echo "$templates" | grep "^ja_resolution:" | cut -d: -f2-)
    
    # Create directories if they don't exist
    mkdir -p "$(dirname "$EN_MESSAGES_PATH")"
    mkdir -p "$(dirname "$JA_MESSAGES_PATH")"
    
    # Update English messages
    en_messages=$(echo "$en_messages" | jq \
        --arg user_key "${new_code}_USER" \
        --arg dev_key "${new_code}_DEV" \
        --arg resolution_key "${new_code}_RESOLUTION" \
        --arg user_msg "$en_user" \
        --arg dev_msg "$en_dev" \
        --arg resolution_msg "$en_resolution" \
        '. + {($user_key): {"message": $user_msg}, ($dev_key): {"message": $dev_msg}, ($resolution_key): {"message": $resolution_msg}}')
    
    # Update Japanese messages
    ja_messages=$(echo "$ja_messages" | jq \
        --arg user_key "${new_code}_USER" \
        --arg dev_key "${new_code}_DEV" \
        --arg resolution_key "${new_code}_RESOLUTION" \
        --arg user_msg "$ja_user" \
        --arg dev_msg "$ja_dev" \
        --arg resolution_msg "$ja_resolution" \
        '. + {($user_key): {"message": $user_msg}, ($dev_key): {"message": $dev_msg}, ($resolution_key): {"message": $resolution_msg}}')
    
    # Save files
    echo "$en_messages" | jq . > "$EN_MESSAGES_PATH"
    echo "$ja_messages" | jq . > "$JA_MESSAGES_PATH"
    
    log_success "Reserved error code: $new_code"
    log_info "Category-specific templates created for $category"
    log_info "Please update the messages with actual content"
    echo ""
    echo "📋 Created keys:"
    echo "   ${new_code}_USER"
    echo "   ${new_code}_DEV"
    echo "   ${new_code}_RESOLUTION"
}

# Generate documentation
generate_documentation() {
    log_info "Generating error code documentation..."
    
    local en_messages
    en_messages=$(load_messages "$EN_MESSAGES_PATH")
    
    local error_codes
    error_codes=$(extract_error_codes "$en_messages")
    
    local doc_file="$DOCS_DIR/ERROR_CODES.md"
    mkdir -p "$DOCS_DIR"
    
    {
        echo "# Error Codes Reference"
        echo ""
        echo "This document lists all error codes used in the application."
        echo ""
        
        local current_category=""
        while IFS= read -r code; do
            [ -z "$code" ] && continue
            
            local category
            category=$(echo "$code" | sed 's/^E_\([A-Z_]*\)_[0-9]*/\1/')
            
            if [ "$category" != "$current_category" ]; then
                echo "## $category"
                echo ""
                current_category="$category"
            fi
            
            local user_msg dev_msg resolution_msg
            user_msg=$(echo "$en_messages" | jq -r ".\"${code}_USER\".message // \"N/A\"")
            dev_msg=$(echo "$en_messages" | jq -r ".\"${code}_DEV\".message // \"N/A\"")
            resolution_msg=$(echo "$en_messages" | jq -r ".\"${code}_RESOLUTION\".message // \"N/A\"")
            
            echo "### $code"
            echo ""
            echo "- **User Message**: $user_msg"
            echo "- **Developer Message**: $dev_msg"
            echo "- **Resolution**: $resolution_msg"
            echo ""
        done <<< "$error_codes"
    } > "$doc_file"
    
    log_success "Documentation generated: $doc_file"
}

# Validate error codes
validate_error_codes() {
    log_info "Validating error codes..."
    
    local messages
    messages=$(load_messages "$EN_MESSAGES_PATH")
    
    local error_codes
    error_codes=$(extract_used_error_codes "$SRC_DIR")
    
    local missing_keys=()
    local incomplete_codes=()
    local has_errors=false
    
    while IFS= read -r error_code; do
        [ -z "$error_code" ] && continue
        
        local user_key="${error_code}_USER"
        local dev_key="${error_code}_DEV"
        local resolution_key="${error_code}_RESOLUTION"
        
        # Check if keys exist
        local user_exists=$(echo "$messages" | jq -r "has(\"$user_key\")")
        local dev_exists=$(echo "$messages" | jq -r "has(\"$dev_key\")")
        local resolution_exists=$(echo "$messages" | jq -r "has(\"$resolution_key\")")
        
        if [ "$user_exists" != "true" ] || [ "$dev_exists" != "true" ] || [ "$resolution_exists" != "true" ]; then
            missing_keys+=("$error_code")
            has_errors=true
        else
            # Check for TODO placeholders
            local user_msg=$(echo "$messages" | jq -r ".\"$user_key\".message // \"\"")
            local resolution_msg=$(echo "$messages" | jq -r ".\"$resolution_key\".message // \"\"")
            
            if [[ "$user_msg" == *"[TODO]"* ]] || [[ "$resolution_msg" == *"[TODO]"* ]]; then
                incomplete_codes+=("$error_code")
            fi
        fi
    done <<< "$error_codes"
    
    # Report results
    if [ ${#missing_keys[@]} -gt 0 ]; then
        log_error "Missing error code messages:"
        for code in "${missing_keys[@]}"; do
            echo "   $code: Missing _USER, _DEV, or _RESOLUTION keys"
        done
        echo ""
        log_info "Run: $0 reserve <category> to create missing messages"
    fi
    
    if [ ${#incomplete_codes[@]} -gt 0 ]; then
        log_warning "Incomplete error code messages:"
        for code in "${incomplete_codes[@]}"; do
            echo "   $code: Contains [TODO] placeholders"
        done
        echo ""
        log_info "Update messages in public/_locales/en/messages.json"
    fi
    
    if [ "$has_errors" = true ]; then
        return 1
    fi
    
    if [ ${#missing_keys[@]} -eq 0 ] && [ ${#incomplete_codes[@]} -eq 0 ]; then
        log_success "All error codes are valid"
    fi
    
    return 0
}

# Manual test instructions
show_manual_tests() {
    log_info "Manual Testing Instructions"
    echo ""
    echo "=== Export-Import Flow Test ==="
    echo "1. Load the extension in Chrome"
    echo "2. Create test data:"
    echo "   - Websites: Test Site 1 (enabled), Test Site 2 (disabled)"
    echo "   - XPaths: Login form elements with various action types"
    echo "   - Automation Variables: Test credentials and settings"
    echo "3. Export each data type to CSV from management screens"
    echo "4. Note down the exported file contents"
    echo "5. Clear extension storage or reinstall"
    echo "6. Import each CSV file back"
    echo "7. Verify all data is restored correctly"
    echo ""
    echo "=== Expected Behavior ==="
    echo "- All exported data should be importable without errors"
    echo "- IDs and relationships should be preserved"
    echo "- XPath → Website relationships should be maintained"
    echo "- Variable references should work correctly"
    echo ""
    echo "=== Error Code Integration Test ==="
    echo "1. Trigger various error conditions in the extension"
    echo "2. Verify error messages appear in correct language"
    echo "3. Check that USER/DEV/RESOLUTION messages are appropriate"
    echo "4. Test error context substitution (variables in messages)"
    echo ""
}

# Check dependencies
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq."
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  macOS: brew install jq"
        return 1
    fi
    return 0
}

# Main execution
main() {
    local command="${1:-help}"
    
    case "$command" in
        "list")
            check_dependencies || exit 1
            list_error_codes
            ;;
        "reserve")
            check_dependencies || exit 1
            reserve_error_code "$2"
            ;;
        "validate")
            check_dependencies || exit 1
            validate_error_codes
            ;;
        "generate")
            check_dependencies || exit 1
            generate_documentation
            ;;
        "test")
            show_manual_tests
            ;;
        "all")
            check_dependencies || exit 1
            validate_error_codes
            echo ""
            show_manual_tests
            ;;
        *)
            echo "Usage: $0 [list|reserve|validate|generate|test|all]"
            echo ""
            echo "Commands:"
            echo "  list              - List all error codes with status"
            echo "  reserve <category> - Reserve new error code for category"
            echo "  validate          - Validate error codes against messages.json"
            echo "  generate          - Generate error code documentation"
            echo "  test              - Show manual testing instructions"
            echo "  all               - Run validation and show test instructions"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 reserve XPATH"
            echo "  $0 validate"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
