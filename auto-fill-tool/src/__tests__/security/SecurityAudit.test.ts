/**
 * Security Audit Tests
 * Validates security measures and prevents regressions
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('Security Audit', () => {
  describe('Content Security Policy', () => {
    it('manifest.jsonにCSPが正しく設定されていること', () => {
      const manifestPath = join(__dirname, '../../../public/manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

      expect(manifest.content_security_policy).toBeDefined();
      expect(manifest.content_security_policy.extension_pages).toContain("script-src 'self'");
      expect(manifest.content_security_policy.extension_pages).toContain("object-src 'none'");
      expect(manifest.content_security_policy.extension_pages).toContain("base-uri 'self'");
    });
  });

  describe('External Dependencies', () => {
    it('HTMLファイルに外部CDNの参照がないこと', () => {
      const htmlFiles = [
        'public/popup.html',
        'public/xpath-manager.html',
        'public/system-settings.html',
        'public/automation-variables-manager.html',
        'public/performance-dashboard.html',
      ];

      htmlFiles.forEach((file) => {
        const filePath = join(__dirname, '../../../', file);
        const content = readFileSync(filePath, 'utf8');

        // 外部CDNの使用をチェック
        expect(content).not.toMatch(/https:\/\/unpkg\.com/);
        expect(content).not.toMatch(/https:\/\/cdn\.jsdelivr\.net/);
        expect(content).not.toMatch(/https:\/\/cdnjs\.cloudflare\.com/);

        // ローカルvendorファイルの使用をチェック
        if (content.includes('alpine') || content.includes('chart')) {
          expect(content).toMatch(/vendor\/(alpine|chart)\.min\.js/);
        }
      });
    });

    it('Webpackでvendorライブラリが自動管理されていること', () => {
      const webpackPath = join(__dirname, '../../../webpack.config.js');
      const content = readFileSync(webpackPath, 'utf8');

      // node_modulesからの自動コピー設定を確認
      expect(content).toContain('node_modules/alpinejs/dist/cdn.min.js');
      expect(content).toContain('node_modules/chart.js/dist/chart.umd.min.js');
      expect(content).toContain('vendor/alpine.min.js');
      expect(content).toContain('vendor/chart.min.js');
    });

    it('package.jsonにvendor管理スクリプトが定義されていること', () => {
      const packagePath = join(__dirname, '../../../package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      expect(packageJson.scripts['vendor:check']).toBeDefined();
      expect(packageJson.scripts['vendor:update']).toBeDefined();
      expect(packageJson.dependencies.alpinejs).toBeDefined();
      expect(packageJson.dependencies['chart.js']).toBeDefined();
    });
  });

  describe('XSS Protection', () => {
    it('DOMPurifySanitizerが実装されていること', () => {
      const sanitizerPath = join(__dirname, '../../infrastructure/adapters/DOMPurifySanitizer.ts');
      const content = readFileSync(sanitizerPath, 'utf8');

      expect(content).toContain('DOMPurify');
      expect(content).toContain('sanitize');
    });

    it('HTMLサニタイゼーションユーティリティが実装されていること', () => {
      const utilPath = join(__dirname, '../../utils/htmlSanitization.ts');
      const content = readFileSync(utilPath, 'utf8');

      expect(content).toContain('sanitizeHtml');
      expect(content).toContain('escapeHtml');
    });
  });

  describe('Data Encryption', () => {
    it('SecureStorageAdapterが実装されていること', () => {
      const secureStoragePath = join(
        __dirname,
        '../../infrastructure/adapters/SecureStorageAdapter.ts'
      );
      const content = readFileSync(secureStoragePath, 'utf8');

      expect(content).toContain('encrypt');
      expect(content).toContain('decrypt');
      expect(content).toContain('CryptoAdapter');
    });
  });

  describe('Password Security', () => {
    it('パスワード強度チェックが実装されていること', () => {
      const passwordValidatorPath = join(__dirname, '../../domain/services/PasswordValidator.ts');
      const content = readFileSync(passwordValidatorPath, 'utf8');

      expect(content).toContain('validate');
      expect(content).toContain('PasswordStrength');
    });
  });
});
