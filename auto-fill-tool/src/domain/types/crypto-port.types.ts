/**
 * Domain Layer: Crypto Adapter Interface
 * Defines contract for encryption/decryption operations
 * This allows domain layer to depend on abstraction, not implementation
 */

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string; // Base64 encoded ciphertext
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt for key derivation
}

/**
 * Crypto Adapter Interface
 * Provides encryption/decryption operations without exposing implementation details
 */
export interface CryptoAdapter {
  /**
   * Encrypt plaintext with password
   * @param plaintext Text to encrypt
   * @param password Password for encryption
   * @returns Encrypted data with IV and salt
   */
  encryptData(plaintext: string, password: string): Promise<EncryptedData>;

  /**
   * Decrypt encrypted data with password
   * @param encryptedData Data to decrypt
   * @param password Password for decryption
   * @returns Decrypted plaintext
   * @throws Error if password is incorrect or data is corrupted
   */
  decryptData(encryptedData: EncryptedData, password: string): Promise<string>;

  /**
   * Check if crypto API is available
   * @returns True if crypto operations are available
   */
  isAvailable(): boolean;
}
