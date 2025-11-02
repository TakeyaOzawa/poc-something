#!/usr/bin/env python3
"""
IdGenerator関連のテストエラーを一括修正するスクリプト
"""

import os
import re
import glob

def fix_duplicate_mockidgenerator(file_path):
    """重複するmockIdGenerator宣言を修正"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 重複するIdGeneratorインポートと宣言を検出・修正
    lines = content.split('\n')
    new_lines = []
    idgenerator_import_added = False
    mockidgenerator_declared = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # IdGeneratorのインポートが重複している場合をスキップ
        if 'import { IdGenerator }' in line and idgenerator_import_added:
            i += 1
            continue
        elif 'import { IdGenerator }' in line:
            idgenerator_import_added = True
            new_lines.append(line)
            i += 1
            continue
        
        # mockIdGeneratorの宣言が重複している場合をスキップ
        if 'const mockIdGenerator' in line and mockidgenerator_declared:
            # 宣言部分をスキップ（複数行の場合もある）
            while i < len(lines) and not lines[i].strip().endswith('};'):
                i += 1
            i += 1  # '};'の行もスキップ
            continue
        elif 'const mockIdGenerator' in line:
            mockidgenerator_declared = True
            new_lines.append(line)
            # 宣言の残りの行も追加
            i += 1
            while i < len(lines) and not lines[i-1].strip().endswith('};'):
                new_lines.append(lines[i])
                i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    # 修正された内容を書き戻し
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print(f"Fixed duplicate declarations in: {file_path}")

def fix_missing_idgenerator_in_create_calls(file_path):
    """AutomationVariables.create()やStorageSyncConfig.create()でIdGeneratorが不足している箇所を修正"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # AutomationVariables.create()の修正
    # パターン1: create({ ... }) → create({ ... }, mockIdGenerator)
    pattern1 = r'(AutomationVariables\.create\(\{[^}]+\}\))'
    replacement1 = r'\1.replace(")", ", mockIdGenerator)")'
    
    # より正確なパターンマッチング
    def replace_create_calls(match):
        call = match.group(1)
        if ', mockIdGenerator' not in call:
            return call.replace('})', '}, mockIdGenerator)')
        return call
    
    content = re.sub(r'(AutomationVariables\.create\(\{[^}]+\}\))', replace_create_calls, content)
    content = re.sub(r'(StorageSyncConfig\.create\(\{[^}]+\}\))', replace_create_calls, content)
    content = re.sub(r'(AutomationResult\.create\(\{[^}]+\}\))', replace_create_calls, content)
    content = re.sub(r'(SyncResult\.create\(\{[^}]+\}\))', replace_create_calls, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed missing IdGenerator in create calls: {file_path}")

def add_missing_idgenerator_import_and_mock(file_path):
    """IdGeneratorのインポートとmockが不足している場合に追加"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # IdGeneratorのインポートがない場合は追加
    if 'import { IdGenerator }' not in content:
        # 最初のimport文の後に追加
        lines = content.split('\n')
        import_index = -1
        for i, line in enumerate(lines):
            if line.startswith('import ') and 'from ' in line:
                import_index = i
        
        if import_index >= 0:
            lines.insert(import_index + 1, "import { IdGenerator } from '@domain/types/id-generator.types';")
            content = '\n'.join(lines)
    
    # mockIdGeneratorの宣言がない場合は追加
    if 'const mockIdGenerator' not in content:
        # describe文の前に追加
        describe_match = re.search(r'(describe\()', content)
        if describe_match:
            insert_pos = describe_match.start()
            mock_declaration = """
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

"""
            content = content[:insert_pos] + mock_declaration + content[insert_pos:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Added missing IdGenerator import and mock: {file_path}")

def main():
    """メイン処理"""
    # テストファイルを検索
    test_files = []
    
    # 各ディレクトリからテストファイルを検索
    patterns = [
        'src/**/__tests__/*.test.ts',
        'src/**/*.test.ts'
    ]
    
    for pattern in patterns:
        test_files.extend(glob.glob(pattern, recursive=True))
    
    print(f"Found {len(test_files)} test files")
    
    # 各ファイルを修正
    for file_path in test_files:
        try:
            # 重複宣言を修正
            fix_duplicate_mockidgenerator(file_path)
            
            # 不足しているIdGeneratorを追加
            add_missing_idgenerator_import_and_mock(file_path)
            
            # create呼び出しでIdGeneratorが不足している箇所を修正
            fix_missing_idgenerator_in_create_calls(file_path)
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    print("IdGenerator修正完了")

if __name__ == '__main__':
    main()
