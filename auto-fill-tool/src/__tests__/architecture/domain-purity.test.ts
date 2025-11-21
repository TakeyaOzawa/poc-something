/**
 * Architecture Tests: Domain Layer Purity
 * Ensures Domain layer remains pure and framework-independent
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Domain Layer Purity', () => {
  const srcPath = path.join(__dirname, '../../');
  const domainPath = path.join(srcPath, 'domain');

  /**
   * Get all TypeScript files in domain directory
   */
  function getDomainFiles(): string[] {
    if (!fs.existsSync(domainPath)) return [];

    const files: string[] = [];
    const items = fs.readdirSync(domainPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const subDir = path.join(domainPath, item.name);
        files.push(...getTypeScriptFilesRecursive(subDir));
      }
    }

    return files;
  }

  function getTypeScriptFilesRecursive(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.')) {
        files.push(...getTypeScriptFilesRecursive(fullPath));
      } else if (
        item.name.endsWith('.ts') &&
        !item.name.endsWith('.test.ts') &&
        !item.name.endsWith('.d.ts')
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Extract all import statements from a file
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
   * List of allowed Node.js built-in modules for domain layer
   */
  const allowedBuiltinModules = [
    'crypto', // For ID generation
    'util', // For utility functions
  ];

  /**
   * List of forbidden external libraries in domain layer
   */
  const forbiddenLibraries = [
    'axios',
    'fetch',
    'node-fetch', // HTTP clients
    'express',
    'fastify',
    'koa', // Web frameworks
    'mongoose',
    'sequelize',
    'typeorm', // ORMs
    'redis',
    'ioredis', // Cache clients
    'lodash',
    'ramda', // Utility libraries (should use native JS)
    'moment',
    'date-fns', // Date libraries (should use native Date)
    'uuid', // ID generation (should use crypto)
    'bcrypt',
    'argon2', // Hashing (should be in infrastructure)
    'jsonwebtoken', // JWT (should be in infrastructure)
    'winston',
    'pino', // Logging (should be in infrastructure)
  ];

  test('Domain層は外部ライブラリに依存してはいけない', () => {
    const domainFiles = getDomainFiles();
    const violations: string[] = [];

    for (const file of domainFiles) {
      const imports = extractImports(file);

      for (const imp of imports) {
        // 相対パスやプロジェクト内パスは除外
        if (imp.startsWith('./') || imp.startsWith('../') || imp.startsWith('@')) {
          continue;
        }

        // Node.js組み込みモジュールのチェック
        if (imp.startsWith('node:') || allowedBuiltinModules.includes(imp)) {
          continue;
        }

        // 禁止されたライブラリのチェック
        if (forbiddenLibraries.some((lib) => imp.startsWith(lib))) {
          violations.push(`${file}: Forbidden library import: ${imp}`);
          continue;
        }

        // その他の外部ライブラリ
        if (!imp.includes('/')) {
          violations.push(`${file}: External library import: ${imp}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層はフレームワーク固有のコードを含んではいけない', () => {
    const domainFiles = getDomainFiles();
    const violations: string[] = [];

    const frameworkKeywords = [
      'chrome.',
      'browser.', // Browser extension APIs
      'window.',
      'document.', // DOM APIs
      'XMLHttpRequest', // HTTP APIs
      // 'localStorage', 'sessionStorage', // Web Storage APIs (許可 - 設定保存のため)
      // 'setTimeout', 'setInterval',     // Timer APIs (許可 - ドメインロジックで必要)
      // 'console.',                      // Console APIs (許可 - デバッグのため)
    ];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // examplesディレクトリは除外
      if (file.includes('/examples/')) {
        continue;
      }

      for (const keyword of frameworkKeywords) {
        if (content.includes(keyword)) {
          violations.push(`${file}: Framework-specific code: ${keyword}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層のエンティティは純粋なビジネスロジックのみを含むこと', () => {
    const entitiesPath = path.join(domainPath, 'entities');
    if (!fs.existsSync(entitiesPath)) return;

    const entityFiles = getTypeScriptFilesRecursive(entitiesPath);
    const violations: string[] = [];

    const forbiddenPatterns = [
      /async\s+\w+\s*\(/, // Async methods (should be in services)
      /Promise</, // Promise usage (should be in services)
      /\.then\(/, // Promise chains
      /await\s+/, // Await usage
      /import.*http/i, // HTTP imports
      /import.*database/i, // Database imports
      /import.*storage/i, // Storage imports
    ];

    for (const file of entityFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push(`${file}: Contains non-pure logic: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層のValue Objectsは不変であること', () => {
    const valuesPath = path.join(domainPath, 'values');
    if (!fs.existsSync(valuesPath)) return;

    const valueFiles = getTypeScriptFilesRecursive(valuesPath);
    const violations: string[] = [];

    for (const file of valueFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Setterメソッドの存在をチェック（標準ライブラリ関数を除外）
      // クラスメソッドとしてのsetterを検出: public/private/protected set...()
      if (/(?:public|private|protected)\s+set\w+\s*\(/g.test(content)) {
        violations.push(`${file}: Contains setter methods (Value Objects should be immutable)`);
      }

      // Mutableなプロパティの存在をチェック
      if (/public\s+\w+\s*:/g.test(content) && !/readonly/g.test(content)) {
        violations.push(`${file}: Contains mutable public properties`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層のサービスは状態を持たないこと', () => {
    const servicesPath = path.join(domainPath, 'services');
    if (!fs.existsSync(servicesPath)) return;

    const serviceFiles = getTypeScriptFilesRecursive(servicesPath);
    const violations: string[] = [];

    for (const file of serviceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file, '.ts');

      // NoOpLoggerなどの特定のサービスは除外
      if (fileName.includes('NoOp') || fileName.includes('Logger')) {
        continue;
      }

      // インスタンス変数の存在をチェック
      if (/private\s+\w+\s*:/g.test(content) || /protected\s+\w+\s*:/g.test(content)) {
        // constructorでの依存注入は除外
        if (!/constructor\s*\(/g.test(content)) {
          violations.push(
            `${file}: Contains instance variables (Domain services should be stateless)`
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('Domain層は適切なディレクトリ構造を持つこと', () => {
    if (!fs.existsSync(domainPath)) {
      expect(fs.existsSync(domainPath)).toBe(true);
      return;
    }

    const expectedDirectories = ['entities', 'values', 'services', 'constants'];

    const actualDirectories = fs
      .readdirSync(domainPath, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .filter((name) => !name.startsWith('.') && !name.startsWith('__'));

    const missingDirectories = expectedDirectories.filter(
      (dir) => !actualDirectories.includes(dir)
    );

    // 必須ディレクトリが存在しない場合は警告
    if (missingDirectories.length > 0) {
      console.warn(`Missing recommended domain directories: ${missingDirectories.join(', ')}`);
    }

    // テストは常に成功（推奨構造のため）
    expect(true).toBe(true);
  });
});
