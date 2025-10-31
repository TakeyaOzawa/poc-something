#!/usr/bin/env python3
import os
import re

def fix_test_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Add Result import if needed
    if 'Result.success' in content or 'Result.failure' in content:
        if 'import { Result }' not in content:
            # Find the last import
            import_lines = []
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    import_lines.append(i)
            
            if import_lines:
                last_import_line = import_lines[-1]
                lines.insert(last_import_line + 1, "import { Result } from '@domain/values/result.value';")
                content = '\n'.join(lines)
    
    # 2. Fix mockResolvedValue patterns
    # Pattern: mockResolvedValue({ complex object })
    pattern = r'\.mockResolvedValue\((\{[^}]*(?:\{[^}]*\}[^}]*)*\})\)'
    matches = re.findall(pattern, content, re.DOTALL)
    for match in matches:
        if 'Result.success' not in match and "''" not in match:
            content = content.replace(
                f'.mockResolvedValue({match})',
                f'.mockResolvedValue(Result.success({match}))'
            )
    
    # 3. Fix string literals
    content = re.sub(r'\.mockResolvedValue\((["\'][^"\']*["\'])\)', r'.mockResolvedValue(Result.success(\1))', content)
    
    # 4. Fix array literals (non-empty)
    pattern = r'\.mockResolvedValue\((\[[^\]]+\])\)'
    matches = re.findall(pattern, content)
    for match in matches:
        if 'Result.success' not in match:
            content = content.replace(
                f'.mockResolvedValue({match})',
                f'.mockResolvedValue(Result.success({match}))'
            )
    
    # 5. Fix specific object patterns with quotes
    content = re.sub(
        r"\.mockResolvedValue\((\{[^}]*'[^']*':[^}]*\})\)",
        r'.mockResolvedValue(Result.success(\1))',
        content,
        flags=re.DOTALL
    )
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

def fix_lint_issues(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Fix common lint issues
    # Remove unused imports (basic pattern)
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        # Skip empty lines at the beginning
        if not line.strip() and not new_lines:
            continue
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# Process all TypeScript files
fixed_files = []
for root, dirs, files in os.walk('/home/developer/workspace/auto-fill-tool/src'):
    for file in files:
        if file.endswith('.ts'):
            file_path = os.path.join(root, file)
            fixed = False
            
            if file.endswith('.test.ts'):
                if fix_test_file(file_path):
                    fixed = True
            
            if fix_lint_issues(file_path):
                fixed = True
            
            if fixed:
                fixed_files.append(file_path)

print(f"Fixed {len(fixed_files)} files")
