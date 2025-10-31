#!/usr/bin/env python3
import os
import re

def fix_mock_calls(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fix various mockResolvedValue patterns
    patterns = [
        (r'\.mockResolvedValue\(\{\}\)', '.mockResolvedValue(Result.success({}))'),
        (r'\.mockResolvedValue\(null\)', '.mockResolvedValue(Result.success(null))'),
        (r'\.mockResolvedValue\(undefined\)', '.mockResolvedValue(Result.success(undefined))'),
        (r'\.mockResolvedValue\(true\)', '.mockResolvedValue(Result.success(true))'),
        (r'\.mockResolvedValue\(false\)', '.mockResolvedValue(Result.success(false))'),
        (r'\.mockResolvedValue\(\[\]\)', '.mockResolvedValue(Result.success([]))'),
    ]
    
    changed = False
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            changed = True
    
    # Fix object literals in mockResolvedValue
    content = re.sub(r'\.mockResolvedValue\((\{[^}]+\})\)', r'.mockResolvedValue(Result.success(\1))', content)
    content = re.sub(r'\.mockResolvedValue\((\[[^\]]+\])\)', r'.mockResolvedValue(Result.success(\1))', content)
    
    if changed or content != open(file_path, 'r').read():
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# Find all test files
for root, dirs, files in os.walk('/home/developer/workspace/auto-fill-tool/src'):
    for file in files:
        if file.endswith('.test.ts'):
            file_path = os.path.join(root, file)
            if fix_mock_calls(file_path):
                print(f"Fixed: {file_path}")
