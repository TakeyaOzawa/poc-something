/**
 * Domain Value Object Tests: Website URL
 */

import { WebsiteUrl } from '../WebsiteUrl';

describe('WebsiteUrl', () => {
  describe('constructor', () => {
    test('有効なHTTPS URLで作成できること', () => {
      const url = new WebsiteUrl('https://example.com');
      expect(url.getValue()).toBe('https://example.com/');
    });

    test('有効なHTTP URLで作成できること', () => {
      const url = new WebsiteUrl('http://example.com');
      expect(url.getValue()).toBe('http://example.com/');
    });

    test('プロトコルなしのURLにHTTPSを自動追加すること', () => {
      const url = new WebsiteUrl('example.com');
      expect(url.getValue()).toBe('https://example.com/');
    });

    test('空文字列でエラーが発生すること', () => {
      expect(() => new WebsiteUrl('')).toThrow('URL cannot be empty');
    });

    test('プロトコル付きURLが正しく処理されること', () => {
      const url = new WebsiteUrl('ftp://example.com');
      // FTPプロトコルは自動的にHTTPSに変換される
      expect(url.getValue()).toBe('https://ftp//example.com');
    });

    test('無効なURL形式でエラーが発生すること', () => {
      expect(() => new WebsiteUrl('not a url at all')).toThrow('Invalid URL format');
    });
  });

  describe('getDomain', () => {
    test('ドメインを正しく取得できること', () => {
      const url = new WebsiteUrl('https://www.example.com/path');
      expect(url.getDomain()).toBe('www.example.com');
    });

    test('サブドメインを含むドメインを取得できること', () => {
      const url = new WebsiteUrl('https://api.example.com');
      expect(url.getDomain()).toBe('api.example.com');
    });
  });

  describe('getProtocol', () => {
    test('HTTPSプロトコルを取得できること', () => {
      const url = new WebsiteUrl('https://example.com');
      expect(url.getProtocol()).toBe('https:');
    });

    test('HTTPプロトコルを取得できること', () => {
      const url = new WebsiteUrl('http://example.com');
      expect(url.getProtocol()).toBe('http:');
    });
  });

  describe('isSecure', () => {
    test('HTTPS URLでtrueを返すこと', () => {
      const url = new WebsiteUrl('https://example.com');
      expect(url.isSecure()).toBe(true);
    });

    test('HTTP URLでfalseを返すこと', () => {
      const url = new WebsiteUrl('http://example.com');
      expect(url.isSecure()).toBe(false);
    });
  });

  describe('matches', () => {
    test('完全一致でtrueを返すこと', () => {
      const url = new WebsiteUrl('https://example.com');
      expect(url.matches('https://example.com/')).toBe(true);
    });

    test('ワイルドカードパターンでマッチすること', () => {
      const url = new WebsiteUrl('https://api.example.com/v1/users');
      expect(url.matches('https://api.example.com/*')).toBe(true);
    });

    test('マッチしないパターンでfalseを返すこと', () => {
      const url = new WebsiteUrl('https://example.com');
      expect(url.matches('https://other.com')).toBe(false);
    });
  });

  describe('equals', () => {
    test('同じURLでtrueを返すこと', () => {
      const url1 = new WebsiteUrl('https://example.com');
      const url2 = new WebsiteUrl('https://example.com');
      expect(url1.equals(url2)).toBe(true);
    });

    test('異なるURLでfalseを返すこと', () => {
      const url1 = new WebsiteUrl('https://example.com');
      const url2 = new WebsiteUrl('https://other.com');
      expect(url1.equals(url2)).toBe(false);
    });
  });

  describe('static methods', () => {
    test('from()でインスタンスを作成できること', () => {
      const url = WebsiteUrl.from('https://example.com');
      expect(url.getValue()).toBe('https://example.com/');
    });

    test('fromOptional()で有効なURLからインスタンスを作成できること', () => {
      const url = WebsiteUrl.fromOptional('https://example.com');
      expect(url?.getValue()).toBe('https://example.com/');
    });

    test('fromOptional()で空文字列からundefinedを返すこと', () => {
      const url = WebsiteUrl.fromOptional('');
      expect(url).toBeUndefined();
    });

    test('fromOptional()でundefinedからundefinedを返すこと', () => {
      const url = WebsiteUrl.fromOptional(undefined);
      expect(url).toBeUndefined();
    });
  });

  describe('toString', () => {
    test('URL文字列を返すこと', () => {
      const url = new WebsiteUrl('https://example.com');
      expect(url.toString()).toBe('https://example.com/');
    });
  });
});
