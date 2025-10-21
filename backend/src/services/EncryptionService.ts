import crypto from 'crypto';
import config from '../config';

/**
 * EncryptionService provides field-level encryption using AES-256-GCM
 * Each encrypted value includes a unique initialization vector (IV) for security
 */
export class EncryptionService {
  private readonly algorithm: string;
  private readonly key: Buffer;
  private readonly ivLength: number = 16; // 128 bits for GCM
  private readonly authTagLength: number = 16; // 128 bits authentication tag

  constructor() {
    this.algorithm = config.encryption.algorithm || 'aes-256-gcm';
    
    // Ensure encryption key is 32 bytes for AES-256
    const encryptionKey = config.encryption.key;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Convert key to 32-byte buffer (256 bits)
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Generate a random initialization vector
   * @returns Buffer containing random IV
   */
  generateIV(): Buffer {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - Plain text data to encrypt
   * @param key - Optional custom encryption key (uses default if not provided)
   * @returns Encrypted data as base64 string with format: iv:authTag:encryptedData
   */
  encrypt(data: string, key?: string): string {
    if (!data) {
      return '';
    }

    try {
      // Use custom key if provided, otherwise use default
      const encryptionKey = key 
        ? crypto.scryptSync(key, 'salt', 32)
        : this.key;

      // Generate unique IV for this encryption
      const iv = this.generateIV();

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);

      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:encryptedData (all in hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData - Encrypted data in format: iv:authTag:encryptedData
   * @param key - Optional custom encryption key (uses default if not provided)
   * @returns Decrypted plain text data
   */
  decrypt(encryptedData: string, key?: string): string {
    if (!encryptedData) {
      return '';
    }

    try {
      // Use custom key if provided, otherwise use default
      const decryptionKey = key 
        ? crypto.scryptSync(key, 'salt', 32)
        : this.key;

      // Split the encrypted data into components
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, decryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt sensitive fields in an object
   * @param obj - Object containing fields to encrypt
   * @param fields - Array of field names to encrypt
   * @returns New object with encrypted fields
   */
  encryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        encrypted[field] = this.encrypt(String(encrypted[field]));
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in an object
   * @param obj - Object containing encrypted fields
   * @param fields - Array of field names to decrypt
   * @returns New object with decrypted fields
   */
  decryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (decrypted[field] !== undefined && decrypted[field] !== null) {
        try {
          decrypted[field] = this.decrypt(String(decrypted[field]));
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash data using SHA-256 (one-way, for checksums)
   * @param data - Data to hash
   * @returns Hex string of hash
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a secure random token
   * @param length - Length of token in bytes (default: 32)
   * @returns Hex string of random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Export singleton instance
export default new EncryptionService();
