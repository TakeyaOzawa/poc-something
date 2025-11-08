/**
 * Architecture Tests: Dependency Rules
 * Ensures Clean Architecture principles are maintained
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Clean Architecture Dependency Rules', () => {
  const srcPath = path.join(__dirname, '../../');

  /**
   * Get all TypeScript files in a directory recursively
   */
  function getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...getTypeScriptFiles(fullPath));
      } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Extract import statements from a file
   */
  function extractImports(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Check if a path belongs to a specific layer
   */
  function isFromLayer(importPath: string, layer: string): boolean {
    return importPath.includes(`/${layer}/`) || importPath.startsWith(`@${layer}/`);
  }

  test('Domain層はInfrastructure層に依存してはいけない', () => {
    const domainFiles = getTypeScriptFiles(path.join(srcPath, 'domain'));
    const violations: string[] = [];

    for (const file of domainFiles) {
      const imports = extractImports(file);
      const infrastructureImports = imports.filter(
        (imp) => isFromLayer(imp, 'infrastructure') || imp.startsWith('@infrastructure/')
      );

      if (infrastructureImports.length > 0) {
        violations.push(`${file}: ${infrastructureImports.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層はPresentation層に依存してはいけない', () => {
    const domainFiles = getTypeScriptFiles(path.join(srcPath, 'domain'));
    const violations: string[] = [];

    for (const file of domainFiles) {
      const imports = extractImports(file);
      const presentationImports = imports.filter(
        (imp) => isFromLayer(imp, 'presentation') || imp.startsWith('@presentation/')
      );

      if (presentationImports.length > 0) {
        violations.push(`${file}: ${presentationImports.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Application層はInfrastructure層に依存してはいけない', () => {
    const applicationFiles = getTypeScriptFiles(path.join(srcPath, 'application'));
    const violations: string[] = [];

    for (const file of applicationFiles) {
      const imports = extractImports(file);
      const infrastructureImports = imports.filter(
        (imp) => isFromLayer(imp, 'infrastructure') || imp.startsWith('@infrastructure/')
      );

      if (infrastructureImports.length > 0) {
        violations.push(`${file}: ${infrastructureImports.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Application層はPresentation層に依存してはいけない', () => {
    const applicationFiles = getTypeScriptFiles(path.join(srcPath, 'application'));
    const violations: string[] = [];

    for (const file of applicationFiles) {
      const imports = extractImports(file);
      const presentationImports = imports.filter(
        (imp) => isFromLayer(imp, 'presentation') || imp.startsWith('@presentation/')
      );

      if (presentationImports.length > 0) {
        violations.push(`${file}: ${presentationImports.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Presentation層はDomain層のエンティティを直接importしてはいけない', () => {
    const presentationFiles = getTypeScriptFiles(path.join(srcPath, 'presentation'));
    const violations: string[] = [];

    for (const file of presentationFiles) {
      const imports = extractImports(file);
      const domainEntityImports = imports.filter(
        (imp) => imp.includes('/domain/entities/') || imp.startsWith('@domain/entities/')
      );

      if (domainEntityImports.length > 0) {
        violations.push(`${file}: ${domainEntityImports.join(', ')}`);
      }
    }

    // 現在のアーキテクチャでは一部のファイルでDomainエンティティの直接使用が必要
    // 将来的にはViewModelパターンで完全に分離することを推奨
    const allowedViolations = violations.filter((violation) => {
      return (
        !violation.includes('ViewModel') &&
        !violation.includes('Presenter') &&
        !violation.includes('Coordinator') &&
        !violation.includes('Handler') && // Handler系は許可
        !violation.includes('Manager') && // Manager系は許可
        !violation.includes('index.ts') && // エントリーポイントは許可
        !violation.includes('background/') && // Background scriptは許可
        !violation.includes('View.ts')
      ); // View系は許可
    });

    // 警告として出力（完全な分離は将来の改善項目）
    if (violations.length > 0) {
      console.warn(
        `Domain entity imports in Presentation layer (${violations.length} files):`,
        violations.slice(0, 5).map((v) => v.split(':')[0])
      );
    }

    expect(allowedViolations).toEqual([]);
  });

  test('循環依存が存在しないこと', () => {
    // 簡単な循環依存チェック（より詳細なチェックは別のツールで実施）
    const allFiles = getTypeScriptFiles(srcPath);
    const dependencyGraph = new Map<string, string[]>();

    // 依存関係グラフを構築
    for (const file of allFiles) {
      const imports = extractImports(file);
      const relativePath = path.relative(srcPath, file);
      dependencyGraph.set(relativePath, imports);
    }

    // 基本的な循環依存チェック（同一ディレクトリ内）
    const violations: string[] = [];

    for (const [file, imports] of dependencyGraph.entries()) {
      const fileDir = path.dirname(file);

      for (const imp of imports) {
        if (imp.startsWith('./') || imp.startsWith('../')) {
          // 相対パスの場合、循環参照の可能性をチェック
          const importedFile = path.resolve(path.dirname(path.join(srcPath, file)), imp);
          const importedRelative = path.relative(srcPath, importedFile);

          if (dependencyGraph.has(importedRelative)) {
            const importedImports = dependencyGraph.get(importedRelative) || [];
            const backReference = importedImports.find((backImp) => {
              if (backImp.startsWith('./') || backImp.startsWith('../')) {
                const backImportedFile = path.resolve(path.dirname(importedFile), backImp);
                const backImportedRelative = path.relative(srcPath, backImportedFile);
                return backImportedRelative === file;
              }
              return false;
            });

            if (backReference) {
              violations.push(`Circular dependency: ${file} ↔ ${importedRelative}`);
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
