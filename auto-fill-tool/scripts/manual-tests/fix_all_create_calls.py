#!/usr/bin/env python3
"""
全エンティティのcreate()呼び出しでIdGeneratorが不足している箇所を修正するスクリプト
"""

import re
import glob

def fix_entity_create_calls(file_path):
    """エンティティのcreate()でIdGeneratorが不足している箇所を修正"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 対象エンティティのリスト
    entities = [
        'AutomationVariables',
        'StorageSyncConfig', 
        'AutomationResult',
        'SyncResult',
        'Website',
        'TabRecording',
        'SyncHistory'
    ]
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # エンティティ.create({で始まる行を検出
        entity_found = None
        for entity in entities:
            if f'{entity}.create({{' in line and ', mockIdGenerator' not in line:
                entity_found = entity
                break
        
        if entity_found:
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
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed entity create calls in: {file_path}")

def main():
    """メイン処理"""
    # テストファイルを検索
    test_files = []
    
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
            fix_entity_create_calls(file_path)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    print("全エンティティのcreate呼び出し修正完了")

if __name__ == '__main__':
    main()
