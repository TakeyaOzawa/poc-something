#!/usr/bin/env python3
import os
import re

def fix_complex_mocks(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Fix object literals that are not wrapped in Result.success
    # Pattern: mockResolvedValue({ 'key': { ... } })
    pattern = r'\.mockResolvedValue\((\{\s*\'[^\']+\':\s*\{[^}]+\}[^}]*\})\)'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for match in matches:
        if 'Result.success' not in match:
            content = content.replace(
                f'.mockResolvedValue({match})',
                f'.mockResolvedValue(Result.success({match}))'
            )
    
    # Fix array literals
    pattern = r'\.mockResolvedValue\((\[[^\]]+\])\)'
    matches = re.findall(pattern, content)
    
    for match in matches:
        if 'Result.success' not in match and match != '[]':
            content = content.replace(
                f'.mockResolvedValue({match})',
                f'.mockResolvedValue(Result.success({match}))'
            )
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# Find all test files
for root, dirs, files in os.walk('/home/developer/workspace/auto-fill-tool/src'):
    for file in files:
        if file.endswith('.test.ts'):
            file_path = os.path.join(root, file)
            if fix_complex_mocks(file_path):
                print(f"Fixed complex mocks in: {file_path}")
