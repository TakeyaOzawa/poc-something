#!/usr/bin/env python3
import os
import re

def add_result_import(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if Result is used but not imported
    if 'Result.success' in content or 'Result.failure' in content:
        # Check if Result is already imported
        if 'import { Result }' not in content and 'import {Result}' not in content:
            # Find the last import statement
            import_pattern = r'(import .+?;)\n'
            imports = re.findall(import_pattern, content)
            
            if imports:
                # Add Result import after the last import
                last_import = imports[-1]
                result_import = "import { Result } from '@domain/types/result.types';"
                
                # Replace the last import with itself + Result import
                content = content.replace(
                    last_import,
                    last_import + '\n' + result_import
                )
                
                with open(file_path, 'w') as f:
                    f.write(content)
                return True
    return False

# Find all test files that need Result import
for root, dirs, files in os.walk('/home/developer/workspace/auto-fill-tool/src'):
    for file in files:
        if file.endswith('.test.ts'):
            file_path = os.path.join(root, file)
            if add_result_import(file_path):
                print(f"Added Result import to: {file_path}")
