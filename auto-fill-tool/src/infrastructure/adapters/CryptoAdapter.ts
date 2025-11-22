/**
 * Infrastructure Layer: Crypto Adapter
 * Implements CryptoAdapter interface using Web Crypto API
 * - AES-GCM encryption
 * - PBKDF2 key derivation
 */

import { CryptoAdapter as ICryptoAdapter, EncryptedData } from '@domain/ports/CryptoPort';

/**
 * Web Crypto Adapter
 * Provides AES-256-GCM encryption with PBKDF2 key derivation
 * Implements the CryptoAdapter interface from domain layer
 */
export class WebCryptoAdapter implements ICryptoAdapter {
  // Algorithm constants
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly PBKDF2_ITERATIONS = 100000;
  private readonly PBKDF2_HASH = 'SHA-256';
  private readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Check if Web Crypto API is available
   * @returns true if Web Crypto API is available
   */
  isAvailable(): boolean {
    return (
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof crypto.getRandomValues !== 'undefined'
    );
  }

  /**
   * Encrypt data using AES-GCM
   * @param plaintext Plain text data to encrypt
   * @param password User's master password
   * @returns Encrypted data with IV and salt
   */
  async encryptData(plaintext: string, password: string): Promise<EncryptedData> {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    // Derive key from password
    const key = await this.deriveKeyFromPassword(password, salt);

    // Encrypt data
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      plaintextBuffer
    );

    // Convert to base64 for storage
    return {
      ciphertext: this.arrayBufferToBase64(ciphertextBuffer),
      iv: this.arrayBufferToBase64(iv.buffer),
      salt: this.arrayBufferToBase64(salt.buffer),
    };
  }

  /**
   * Decrypt data using AES-GCM
   * @param encryptedData Encrypted data with IV and salt
   * @param password User's master password
   * @returns Decrypted plain text
   * @throws Error if decryption fails (wrong password or corrupted data)
   */
  async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
      // Convert from base64
      const ciphertextBuffer = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const salt = this.base64ToArrayBuffer(encryptedData.salt);

      // Derive key from password
      const key = await this.deriveKeyFromPassword(password, new Uint8Array(salt));

      // Decrypt data
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: new Uint8Array(iv),
        },
        key,
        ciphertextBuffer
      );

      // Convert to string
      return new TextDecoder().decode(plaintextBuffer);
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }

  /**
   * Derive a cryptographic key from a password using PBKDF2
   * @param password User's master password
   * @param salt Salt for key derivation
   * @returns CryptoKey for encryption/decryption
   */
  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    // Convert password to key material
    const passwordBuffer = new TextEncoder().encode(password);
    const keyMaterial = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);

    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.PBKDF2_ITERATIONS,
        hash: this.PBKDF2_HASH,
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  /**
   * Generate a random salt for PBKDF2
   * @returns Base64 encoded salt
   */
  generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return this.arrayBufferToBase64(salt.buffer);
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export for backward compatibility (deprecated - use WebCryptoAdapter directly)
/**
 * @deprecated Use WebCryptoAdapter instead. This class will be removed in future versions.
 */
export class CryptoUtils {
  private static instance = new WebCryptoAdapter();

  static async encryptData(plaintext: string, password: string): Promise<EncryptedData> {
    return this.instance.encryptData(plaintext, password);
  }

  static async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    return this.instance.decryptData(encryptedData, password);
  }

  static generateSalt(): string {
    return this.instance.generateSalt();
  }

  static isWebCryptoAvailable(): boolean {
    return this.instance.isAvailable();
  }

  static async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    // @ts-expect-error - Accessing private method for backward compatibility
    return this.instance.deriveKeyFromPassword(password, salt);
  }
}
