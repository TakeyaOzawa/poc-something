#!/usr/bin/env python3
import os
import re

def fix_all_mock_patterns(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Fix complex object literals in mockResolvedValue
    # Match multi-line object literals
    pattern = r'\.mockResolvedValue\((\{[^}]*(?:\{[^}]*\}[^}]*)*\})\)'
    def replace_complex_object(match):
        obj = match.group(1)
        if 'Result.success' not in obj:
            return f'.mockResolvedValue(Result.success({obj}))'
        return match.group(0)
    
    content = re.sub(pattern, replace_complex_object, content, flags=re.DOTALL)
    
    # Pattern 2: Fix string literals
    content = re.sub(r'\.mockResolvedValue\((["\'][^"\']*["\'])\)', r'.mockResolvedValue(Result.success(\1))', content)
    
    # Pattern 3: Fix number literals
    content = re.sub(r'\.mockResolvedValue\((\d+)\)', r'.mockResolvedValue(Result.success(\1))', content)
    
    # Pattern 4: Fix boolean literals that aren't already wrapped
    content = re.sub(r'\.mockResolvedValue\((true|false)\)(?!\))', r'.mockResolvedValue(Result.success(\1))', content)
    
    # Pattern 5: Fix array literals that aren't empty
    pattern = r'\.mockResolvedValue\((\[[^\]]+\])\)'
    def replace_array(match):
        arr = match.group(1)
        if 'Result.success' not in arr and arr != '[]':
            return f'.mockResolvedValue(Result.success({arr}))'
        return match.group(0)
    
    content = re.sub(pattern, replace_array, content)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# Process all test files
fixed_files = []
for root, dirs, files in os.walk('/home/developer/workspace/auto-fill-tool/src'):
    for file in files:
        if file.endswith('.test.ts'):
            file_path = os.path.join(root, file)
            if fix_all_mock_patterns(file_path):
                fixed_files.append(file_path)

print(f"Fixed {len(fixed_files)} files:")
for file_path in fixed_files:
    print(f"  {file_path}")
