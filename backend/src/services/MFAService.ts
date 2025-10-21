import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { config } from '../config';

/**
 * MFA secret interface
 */
export interface MFASecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * MFA verification result interface
 */
export interface MFAVerificationResult {
  verified: boolean;
  message?: string;
}

/**
 * Multi-Factor Authentication service using TOTP
 */
export class MFAService {
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;

  /**
   * Generate MFA secret for a user
   * @param username - User's username
   * @param _email - User's email (reserved for future use)
   * @returns MFA secret with QR code URL and backup codes
   */
  public async generateSecret(username: string, _email: string): Promise<MFASecret> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${config.mfa.issuer} (${username})`,
      issuer: config.mfa.issuer,
      length: 32,
    });

    if (!secret.base32) {
      throw new Error('Failed to generate MFA secret');
    }

    // Generate QR code URL
    const qrCodeUrl = await this.generateQRCode(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Generate QR code as data URL
   * @param otpauthUrl - OTP auth URL from speakeasy
   * @returns QR code as data URL
   */
  public async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   * @param token - 6-digit TOTP token from user
   * @param secret - User's MFA secret
   * @returns Verification result
   */
  public verifyToken(token: string, secret: string): MFAVerificationResult {
    try {
      // Remove any spaces or dashes from token
      const cleanToken = token.replace(/[\s-]/g, '');

      // Verify token is 6 digits
      if (!/^\d{6}$/.test(cleanToken)) {
        return {
          verified: false,
          message: 'Token must be 6 digits',
        };
      }

      // Verify TOTP token with time window
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: cleanToken,
        window: config.mfa.window, // Allow 1 time step before/after
      });

      return {
        verified,
        message: verified ? 'Token verified successfully' : 'Invalid token',
      };
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      return {
        verified: false,
        message: 'Token verification failed',
      };
    }
  }

  /**
   * Generate backup codes for account recovery
   * @returns Array of backup codes
   */
  public generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = this.generateRandomCode(this.BACKUP_CODE_LENGTH);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate a random alphanumeric code
   * @param length - Length of the code
   * @returns Random code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars[randomIndex];
    }

    // Format as XXXX-XXXX for 8-character codes
    if (length === 8) {
      return `${code.substring(0, 4)}-${code.substring(4)}`;
    }

    return code;
  }

  /**
   * Hash backup code for storage
   * @param code - Plain text backup code
   * @returns Hashed backup code
   */
  public hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify backup code
   * @param code - Plain text backup code from user
   * @param hashedCode - Hashed backup code from database
   * @returns True if codes match
   */
  public verifyBackupCode(code: string, hashedCode: string): boolean {
    const cleanCode = code.replace(/[\s-]/g, '');
    const hashedInput = this.hashBackupCode(cleanCode);
    return hashedInput === hashedCode;
  }

  /**
   * Encrypt MFA secret for database storage
   * @param secret - Plain text MFA secret
   * @param encryptionKey - Encryption key
   * @returns Encrypted secret with IV
   */
  public encryptSecret(secret: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return IV + authTag + encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt MFA secret from database
   * @param encryptedData - Encrypted secret with IV
   * @param encryptionKey - Encryption key
   * @returns Decrypted secret
   */
  public decryptSecret(encryptedData: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate current TOTP token (for testing purposes)
   * @param secret - MFA secret
   * @returns Current TOTP token
   */
  public generateCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }
}

// Export singleton instance
export const mfaService = new MFAService();

