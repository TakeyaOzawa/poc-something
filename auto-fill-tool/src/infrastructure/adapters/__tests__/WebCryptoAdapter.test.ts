/**
 * Unit Tests: WebCryptoAdapter and CryptoUtils (deprecated)
 */

import { WebCryptoAdapter, CryptoUtils } from '../CryptoAdapter';
import { EncryptedData } from '@domain/ports/CryptoPort';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('WebCryptoAdapter', () => {
  let service: WebCryptoAdapter;
  const testPassword = 'TestPassword123!@#';
  const testPlaintext = 'This is sensitive data that needs to be encrypted';

  beforeEach(() => {
    service = new WebCryptoAdapter();
  });

  describe('isAvailable', () => {
    it('should return true when Web Crypto API is available', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('generateSalt', () => {
    it('should generate a base64 encoded salt', () => {
      const salt = service.generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should generate different salts each time', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      expect(salt1).not.toBe(salt2);
    });

    it('should generate base64 encoded string', () => {
      const salt = service.generateSalt();
      // Base64 regex pattern
      expect(salt).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);
      const decrypted = await service.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(testPlaintext);
    });

    it('should produce different ciphertext each time (due to random IV)', async () => {
      const encrypted1 = await service.encryptData(testPlaintext, testPassword);
      const encrypted2 = await service.encryptData(testPlaintext, testPassword);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should encrypt and decrypt empty string', async () => {
      const plaintext = '';
      const encrypted = await service.encryptData(plaintext, testPassword);
      const decrypted = await service.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt long text', async () => {
      const longText = 'A'.repeat(10000);
      const encrypted = await service.encryptData(longText, testPassword);
      const decrypted = await service.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(longText);
    });

    it('should encrypt and decrypt Unicode characters', async () => {
      const unicodeText = '日本語テスト 🔐 encrypted データ';
      const encrypted = await service.encryptData(unicodeText, testPassword);
      const decrypted = await service.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(unicodeText);
    });

    it('should encrypt and decrypt special characters', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = await service.encryptData(specialChars, testPassword);
      const decrypted = await service.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(specialChars);
    });

    it('should encrypt and decrypt JSON data', async () => {
      const jsonData = JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        data: [1, 2, 3, 4, 5],
      });
      const encrypted = await service.encryptData(jsonData, testPassword);
      const decrypted = await service.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
    });
  });

  describe('decryptData error handling', () => {
    it('should throw error with wrong password', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);

      await expect(service.decryptData(encrypted, 'WrongPassword')).rejects.toThrow(
        'Decryption failed: Invalid password or corrupted data'
      );
    });

    it('should throw error with corrupted ciphertext', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);
      const corruptedData: EncryptedData = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -5) + 'XXXXX',
      };

      await expect(service.decryptData(corruptedData, testPassword)).rejects.toThrow(
        'Decryption failed: Invalid password or corrupted data'
      );
    });

    it('should throw error with corrupted IV', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);
      const corruptedData: EncryptedData = {
        ...encrypted,
        iv: encrypted.iv.slice(0, -5) + 'XXXXX',
      };

      await expect(service.decryptData(corruptedData, testPassword)).rejects.toThrow();
    });

    it('should throw error with corrupted salt', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);
      const corruptedData: EncryptedData = {
        ...encrypted,
        salt: encrypted.salt.slice(0, -5) + 'XXXXX',
      };

      await expect(service.decryptData(corruptedData, testPassword)).rejects.toThrow(
        'Decryption failed: Invalid password or corrupted data'
      );
    });

    it('should throw error with invalid base64 ciphertext', async () => {
      const invalidData: EncryptedData = {
        ciphertext: 'invalid base64 !!!',
        iv: service.generateSalt(),
        salt: service.generateSalt(),
      };

      await expect(service.decryptData(invalidData, testPassword)).rejects.toThrow();
    });
  });

  describe('encrypted data structure', () => {
    it('should have ciphertext, iv, and salt properties', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
    });

    it('should have all properties as base64 strings', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);

      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.salt).toBe('string');

      // Base64 regex
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(encrypted.ciphertext).toMatch(base64Regex);
      expect(encrypted.iv).toMatch(base64Regex);
      expect(encrypted.salt).toMatch(base64Regex);
    });

    it('should be serializable to JSON', async () => {
      const encrypted = await service.encryptData(testPlaintext, testPassword);
      const json = JSON.stringify(encrypted);
      const parsed: EncryptedData = JSON.parse(json);

      const decrypted = await service.decryptData(parsed, testPassword);
      expect(decrypted).toBe(testPlaintext);
    });
  });

  describe('security properties', () => {
    it('should not reveal plaintext in encrypted data', async () => {
      const plaintext = 'SecretData12345';
      const encrypted = await service.encryptData(plaintext, testPassword);

      const encryptedString = JSON.stringify(encrypted);
      expect(encryptedString).not.toContain(plaintext);
      expect(encryptedString).not.toContain('SecretData');
    });

    it('should produce different encrypted output for same input (semantic security)', async () => {
      const encrypted1 = await service.encryptData(testPlaintext, testPassword);
      const encrypted2 = await service.encryptData(testPlaintext, testPassword);

      // Different IV and salt should produce different ciphertext
      expect(encrypted1).not.toEqual(encrypted2);
    });
  });
});

// Backward compatibility tests for deprecated CryptoUtils wrapper
describe('CryptoUtils (deprecated)', () => {
  const testPassword = 'TestPassword123!@#';
  const testPlaintext = 'This is sensitive data that needs to be encrypted';

  describe('isWebCryptoAvailable', () => {
    it('should return true when Web Crypto API is available', () => {
      expect(CryptoUtils.isWebCryptoAvailable()).toBe(true);
    });
  });

  describe('generateSalt', () => {
    it('should generate a base64 encoded salt', () => {
      const salt = CryptoUtils.generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should generate different salts each time', () => {
      const salt1 = CryptoUtils.generateSalt();
      const salt2 = CryptoUtils.generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await CryptoUtils.encryptData(testPlaintext, testPassword);
      const decrypted = await CryptoUtils.decryptData(encrypted, testPassword);

      expect(decrypted).toBe(testPlaintext);
    });

    it('should produce different ciphertext each time', async () => {
      const encrypted1 = await CryptoUtils.encryptData(testPlaintext, testPassword);
      const encrypted2 = await CryptoUtils.encryptData(testPlaintext, testPassword);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });
  });

  describe('deriveKeyFromPassword', () => {
    it('should derive a CryptoKey from password and salt', async () => {
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);

      const key = await CryptoUtils.deriveKeyFromPassword(testPassword, salt);

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should derive the same key for the same password and salt', async () => {
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);

      const key1 = await CryptoUtils.deriveKeyFromPassword(testPassword, salt);
      const key2 = await CryptoUtils.deriveKeyFromPassword(testPassword, salt);

      // Test that the keys produce the same encrypted output for the same input
      const testData = 'test data for key comparison';
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted1 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        new TextEncoder().encode(testData)
      );

      const encrypted2 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key2,
        new TextEncoder().encode(testData)
      );

      // Same key + same IV + same plaintext = same ciphertext
      expect(new Uint8Array(encrypted1)).toEqual(new Uint8Array(encrypted2));
    });

    it('should derive different keys for different passwords', async () => {
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);

      const key1 = await CryptoUtils.deriveKeyFromPassword('password1', salt);
      const key2 = await CryptoUtils.deriveKeyFromPassword('password2', salt);

      // Test that different keys produce different encrypted outputs
      const testData = 'test data for key comparison';
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted1 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        new TextEncoder().encode(testData)
      );

      const encrypted2 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key2,
        new TextEncoder().encode(testData)
      );

      // Different keys + same IV + same plaintext = different ciphertext
      expect(new Uint8Array(encrypted1)).not.toEqual(new Uint8Array(encrypted2));
    });
  });
});
