import crypto from 'crypto';
import { app } from 'electron';
import os from 'os';

export class SecurityService {
  private encryptionKey: string = '';
  private algorithm = 'aes-256-gcm';
  private keyDerivationIterations = 100000;

  initialize(): void {
    this.encryptionKey = this.generateEncryptionKey();
    console.log('Security service initialized');
  }

  private generateEncryptionKey(): string {
    // Create a device-specific key based on machine characteristics
    const machineId = this.getMachineId();
    const appName = app.getName();
    const appVersion = app.getVersion();
    
    // Combine various sources for key generation
    const keyMaterial = `${machineId}-${appName}-${appVersion}`;
    
    // Use PBKDF2 for key derivation
    const salt = crypto.createHash('sha256').update(keyMaterial).digest();
    return crypto.pbkdf2Sync(
      keyMaterial,
      salt,
      this.keyDerivationIterations,
      32,
      'sha256'
    ).toString('hex');
  }

  private getMachineId(): string {
    // Generate a machine-specific identifier
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const userInfo = os.userInfo();
    
    const machineInfo = `${platform}-${arch}-${hostname}-${userInfo.username}`;
    return crypto.createHash('sha256').update(machineInfo).digest('hex');
  }

  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = (cipher as any).getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const result = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted: encrypted,
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      (decipher as any).setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash function for passwords or sensitive data
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const finalSalt = salt || crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(
      data,
      finalSalt,
      this.keyDerivationIterations,
      64,
      'sha256'
    ).toString('hex');
    
    return { hash, salt: finalSalt };
  }

  // Verify hashed data
  verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(data, salt);
    return this.safeCompare(hash, computedHash);
  }

  // Constant-time comparison to prevent timing attacks
  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Generate secure random strings
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Sanitize sensitive data for logging
  sanitizeForLogging(data: any): any {
    const sensitiveFields = [
      'password',
      'apiKey',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
    ];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}
