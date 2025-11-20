#!/usr/bin/env python3
"""
StorageSyncConfig.create()呼び出しでIdGeneratorが不足している箇所を修正するスクリプト
"""

import re
import glob

def fix_storagesyncconfig_create_calls(file_path):
    """StorageSyncConfig.create()でIdGeneratorが不足している箇所を修正"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # StorageSyncConfig.create({ ... }) → StorageSyncConfig.create({ ... }, mockIdGenerator)
    # 複数行にまたがるcreate呼び出しを処理
    pattern = r'(StorageSyncConfig\.create\(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\))'
    
    def replace_create_call(match):
        call = match.group(1)
        if ', mockIdGenerator' not in call:
            # 最後の })を }, mockIdGenerator)に置換
            return call.replace('})', '}, mockIdGenerator)')
        return call
    
    # 単純なパターンマッチングでは複数行対応が困難なため、行ベースで処理
    lines = content.split('\n')
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # StorageSyncConfig.create({で始まる行を検出
        if 'StorageSyncConfig.create({' in line and ', mockIdGenerator' not in line:
            # 複数行にまたがるcreate呼び出しを処理
            create_lines = [line]
            i += 1
            
            # });で終わる行まで収集
            while i < len(lines) and not lines[i].strip().endswith('});'):
                create_lines.append(lines[i])
                i += 1
            
            if i < len(lines):
                # });で終わる行を処理
                end_line = lines[i]
                if ', mockIdGenerator);' not in end_line:
                    end_line = end_line.replace('});', '}, mockIdGenerator);')
                create_lines.append(end_line)
                i += 1
            
            new_lines.extend(create_lines)
        else:
            new_lines.append(line)
            i += 1
    
    # 修正された内容を書き戻し
    new_content = '\n'.join(new_lines)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Fixed StorageSyncConfig.create calls in: {file_path}")

def main():
    """メイン処理"""
    # StorageSyncConfigを使用するテストファイルを検索
    test_files = []
    
    patterns = [
        'src/**/__tests__/*.test.ts',
        'src/**/*.test.ts'
    ]
    
    for pattern in patterns:
        test_files.extend(glob.glob(pattern, recursive=True))
    
    # StorageSyncConfigを使用するファイルのみを対象
    target_files = []
    for file_path in test_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'StorageSyncConfig.create(' in content:
                    target_files.append(file_path)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    print(f"Found {len(target_files)} files with StorageSyncConfig.create calls")
    
    # 各ファイルを修正
    for file_path in target_files:
        try:
            fix_storagesyncconfig_create_calls(file_path)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    print("StorageSyncConfig修正完了")

if __name__ == '__main__':
    main()
