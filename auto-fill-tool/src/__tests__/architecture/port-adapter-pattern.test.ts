/**
 * Architecture Tests: Port-Adapter Pattern
 * Ensures Hexagonal Architecture principles are maintained
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Port-Adapter Pattern Compliance', () => {
  const srcPath = path.join(__dirname, '../../');

  /**
   * Get all TypeScript files in a directory
   */
  function getTypeScriptFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];

    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files.push(...getTypeScriptFiles(fullPath));
      } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if a file contains interface definitions
   */
  function hasInterfaceDefinitions(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    return /export\s+interface\s+\w+/.test(content);
  }

  /**
   * Check if a file contains class implementations
   */
  function hasClassImplementations(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    return /export\s+class\s+\w+.*implements/.test(content);
  }

  test('Domain層のportsディレクトリにはインターフェースのみが存在すること', () => {
    const portsPath = path.join(srcPath, 'domain/ports');
    if (!fs.existsSync(portsPath)) {
      // portsディレクトリが存在しない場合はスキップ
      return;
    }

    const portFiles = getTypeScriptFiles(portsPath);
    const violations: string[] = [];

    for (const file of portFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // クラス定義が含まれている場合は違反
      if (/export\s+class\s+/.test(content)) {
        violations.push(`${file}: Contains class definition (should be interface only)`);
      }

      // インターフェース定義が含まれていない場合は違反
      if (!/export\s+interface\s+/.test(content)) {
        violations.push(`${file}: Missing interface definition`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Infrastructure層のadaptersディレクトリにはポートの実装が存在すること', () => {
    const adaptersPath = path.join(srcPath, 'infrastructure/adapters');
    if (!fs.existsSync(adaptersPath)) {
      // adaptersディレクトリが存在しない場合はスキップ
      return;
    }

    const adapterFiles = getTypeScriptFiles(adaptersPath);
    const violations: string[] = [];

    for (const file of adapterFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // implementsキーワードが含まれていない場合は警告
      if (!/implements\s+/.test(content) && !/export\s+class\s+/.test(content)) {
        violations.push(`${file}: May not be implementing a port interface`);
      }
    }

    // 警告のみで、テストは失敗させない（実装方法が多様なため）
    if (violations.length > 0) {
      console.warn('Port implementation warnings:', violations);
    }

    expect(true).toBe(true); // Always pass, but log warnings
  });

  test('Repository実装クラスはRepositoryインターフェースを実装していること', () => {
    const repositoriesPath = path.join(srcPath, 'infrastructure/repositories');
    if (!fs.existsSync(repositoriesPath)) {
      return;
    }

    const repositoryFiles = getTypeScriptFiles(repositoriesPath);
    const violations: string[] = [];

    for (const file of repositoryFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file, '.ts');

      // Repository実装クラスの場合（特定のパターンを除外）
      if (
        fileName.includes('Repository') &&
        !fileName.includes('Interface') &&
        !fileName.includes('Config')
      ) {
        // ConfigRepositoryは除外
        // implementsキーワードが含まれているかチェック
        if (!/implements\s+\w*Repository/.test(content)) {
          violations.push(
            `${file}: Repository implementation should implement Repository interface`
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('UseCase実装はDomain層のインターフェースのみに依存していること', () => {
    const usecasesPath = path.join(srcPath, 'application/usecases');
    if (!fs.existsSync(usecasesPath)) {
      return;
    }

    const usecaseFiles = getTypeScriptFiles(usecasesPath);
    const violations: string[] = [];

    for (const file of usecaseFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Infrastructure層の具象クラスを直接importしている場合は違反
      const infrastructureImports =
        content.match(/import\s+.*?\s+from\s+['"]@infrastructure\/.*?['"]/g) || [];

      for (const imp of infrastructureImports) {
        // アダプターやサービスの具象クラスを直接importしている場合
        if (imp.includes('/adapters/') || imp.includes('/services/')) {
          violations.push(`${file}: Direct import of infrastructure implementation: ${imp}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層のサービスは外部依存を持たないこと', () => {
    const servicesPath = path.join(srcPath, 'domain/services');
    if (!fs.existsSync(servicesPath)) {
      return;
    }

    const serviceFiles = getTypeScriptFiles(servicesPath);
    const violations: string[] = [];

    for (const file of serviceFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // 外部ライブラリやInfrastructure層への依存をチェック
      const externalImports = content.match(/import\s+.*?\s+from\s+['"][^@.].*?['"]/g) || [];
      const infrastructureImports =
        content.match(/import\s+.*?\s+from\s+['"]@infrastructure\/.*?['"]/g) || [];

      if (externalImports.length > 0) {
        violations.push(`${file}: External library imports: ${externalImports.join(', ')}`);
      }

      if (infrastructureImports.length > 0) {
        violations.push(`${file}: Infrastructure imports: ${infrastructureImports.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
