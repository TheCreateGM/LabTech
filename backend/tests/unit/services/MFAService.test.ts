import { MFAService } from '../../../src/services/MFAService';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Mock dependencies
jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('crypto');

describe('MFAService', () => {
  let mfaService: MFAService;

  beforeEach(() => {
    jest.clearAllMocks();
    mfaService = new MFAService();
  });

  describe('generateSecret', () => {
    it('should generate MFA secret with QR code and backup codes', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/LabTech%20GeoLab%20(testuser)?secret=JBSWY3DPEHPK3PXP&issuer=LabTech%20GeoLab',
      };

      (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockQRCode');

      const result = await mfaService.generateSecret('testuser', 'test@example.com');

      expect(result.secret).toBe(mockSecret.base32);
      expect(result.qrCodeUrl).toBe('data:image/png;base64,mockQRCode');
      expect(result.backupCodes).toHaveLength(10);
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: expect.stringContaining('testuser'),
        issuer: expect.any(String),
        length: 32,
      });
    });

    it('should throw error if secret generation fails', async () => {
      (speakeasy.generateSecret as jest.Mock).mockReturnValue({ base32: null });

      await expect(mfaService.generateSecret('testuser', 'test@example.com')).rejects.toThrow(
        'Failed to generate MFA secret'
      );
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      const otpauthUrl = 'otpauth://totp/test';
      const mockQRCode = 'data:image/png;base64,mockQRCode';

      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQRCode);

      const result = await mfaService.generateQRCode(otpauthUrl);

      expect(result).toBe(mockQRCode);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(otpauthUrl, expect.any(Object));
    });

    it('should throw error if QR code generation fails', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation failed'));

      await expect(mfaService.generateQRCode('invalid-url')).rejects.toThrow(
        'Failed to generate QR code'
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid TOTP token', () => {
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = mfaService.verifyToken('123456', 'JBSWY3DPEHPK3PXP');

      expect(result.verified).toBe(true);
      expect(result.message).toBe('Token verified successfully');
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        token: '123456',
        window: expect.any(Number),
      });
    });

    it('should reject invalid TOTP token', () => {
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      const result = mfaService.verifyToken('999999', 'JBSWY3DPEHPK3PXP');

      expect(result.verified).toBe(false);
      expect(result.message).toBe('Invalid token');
    });

    it('should reject non-numeric token', () => {
      const result = mfaService.verifyToken('abcdef', 'JBSWY3DPEHPK3PXP');

      expect(result.verified).toBe(false);
      expect(result.message).toBe('Token must be 6 digits');
    });

    it('should handle token with spaces and dashes', () => {
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = mfaService.verifyToken('123 456', 'JBSWY3DPEHPK3PXP');

      expect(result.verified).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith(
        expect.objectContaining({ token: '123456' })
      );
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3);

      (crypto.randomInt as jest.Mock) = mockRandomInt;

      const codes = mfaService.generateBackupCodes();

      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });
  });

  describe('hashBackupCode', () => {
    it('should hash backup code using SHA-256', () => {
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-code'),
      };

      (crypto.createHash as jest.Mock).mockReturnValue(mockHash);

      const result = mfaService.hashBackupCode('ABCD-1234');

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith('ABCD-1234');
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe('hashed-code');
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify matching backup code', () => {
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-code'),
      };

      (crypto.createHash as jest.Mock).mockReturnValue(mockHash);

      const result = mfaService.verifyBackupCode('ABCD-1234', 'hashed-code');

      expect(result).toBe(true);
    });

    it('should reject non-matching backup code', () => {
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('different-hash'),
      };

      (crypto.createHash as jest.Mock).mockReturnValue(mockHash);

      const result = mfaService.verifyBackupCode('ABCD-1234', 'hashed-code');

      expect(result).toBe(false);
    });
  });

  describe('encryptSecret', () => {
    it('should encrypt MFA secret', () => {
      const mockCipher = {
        update: jest.fn().mockReturnValue('encrypted'),
        final: jest.fn().mockReturnValue('data'),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('authtag')),
      };

      const mockIV = Buffer.from('1234567890123456');
      const mockKey = Buffer.from('12345678901234567890123456789012');

      (crypto.randomBytes as jest.Mock).mockReturnValue(mockIV);
      (crypto.scryptSync as jest.Mock).mockReturnValue(mockKey);
      (crypto.createCipheriv as jest.Mock).mockReturnValue(mockCipher);

      const result = mfaService.encryptSecret('secret', 'encryption-key');

      expect(result).toContain(':');
      expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-256-gcm', mockKey, mockIV);
    });
  });

  describe('decryptSecret', () => {
    it('should decrypt MFA secret', () => {
      const mockDecipher = {
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue('decrypted'),
        final: jest.fn().mockReturnValue('secret'),
      };

      const mockKey = Buffer.from('12345678901234567890123456789012');

      (crypto.scryptSync as jest.Mock).mockReturnValue(mockKey);
      (crypto.createDecipheriv as jest.Mock).mockReturnValue(mockDecipher);

      const encryptedData = '313233343536373839303132333435:617574687461673d3d:656e637279707465646461746131323334';
      const result = mfaService.decryptSecret(encryptedData, 'encryption-key');

      expect(result).toBe('decryptedsecret');
      expect(mockDecipher.setAuthTag).toHaveBeenCalled();
    });
  });

  describe('generateCurrentToken', () => {
    it('should generate current TOTP token', () => {
      (speakeasy.totp as jest.Mock).mockReturnValue('123456');

      const result = mfaService.generateCurrentToken('JBSWY3DPEHPK3PXP');

      expect(result).toBe('123456');
      expect(speakeasy.totp).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
      });
    });
  });
});
