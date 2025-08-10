// Security utilities for FINTRAC-compliant applications

/**
 * Generate cryptographically secure random ID
 * Used for form IDs, session tokens, and document references
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a UUID v4 using crypto.getRandomValues
 */
export function generateUUID(): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, function(c) {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Basic input sanitization for FINTRAC forms
 * Removes potentially dangerous characters and scripts
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .trim();
}

/**
 * Validate Canadian postal code format
 */
export function validateCanadianPostalCode(postalCode: string): boolean {
  const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
  return canadianPostalRegex.test(postalCode);
}

/**
 * Validate Canadian phone number formats
 */
export function validateCanadianPhone(phone: string): boolean {
  const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a date represents someone who is at least 18 years old
 */
export function isAdult(dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
}

/**
 * Mask sensitive information for logging/display
 * Keeps first and last 2 characters, masks middle with *
 */
export function maskSensitiveInfo(info: string, visibleChars: number = 2): string {
  if (!info || info.length <= visibleChars * 2) {
    return '*'.repeat(info?.length || 4);
  }
  
  const start = info.substring(0, visibleChars);
  const end = info.substring(info.length - visibleChars);
  const middle = '*'.repeat(info.length - visibleChars * 2);
  
  return start + middle + end;
}

/**
 * Generate secure session token for QR codes
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateSecureId(24);
  return `${timestamp}-${randomPart}`;
}

/**
 * Validate that a session token hasn't expired
 */
export function isSessionTokenValid(token: string, maxAgeMs: number = 30 * 60 * 1000): boolean {
  try {
    const [timestampPart] = token.split('-');
    const timestamp = parseInt(timestampPart, 36);
    const now = Date.now();
    
    return (now - timestamp) <= maxAgeMs;
  } catch (error) {
    return false;
  }
}

/**
 * Basic client-side encryption using Web Crypto API
 * For sensitive form data before transmission
 */
export async function encryptFormData(data: any, password: string): Promise<string> {
  try {
    // Convert password to key
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt data
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(JSON.stringify(data));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt form data');
  }
}

/**
 * Decrypt form data using Web Crypto API
 */
export async function decryptFormData(encryptedData: string, password: string): Promise<any> {
  try {
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract components
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);
    
    // Convert password to key
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive decryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    // Convert back to object
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedData);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt form data');
  }
}

/**
 * Hash password using Web Crypto API (for client-side verification)
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (salt || 'default-salt'));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate secure random salt
 */
export function generateSalt(length: number = 32): string {
  return generateSecureId(length);
}

/**
 * Rate limiting helper - track attempts in memory
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let userAttempts = this.attempts.get(identifier) || [];
    userAttempts = userAttempts.filter(timestamp => timestamp > windowStart);
    
    if (userAttempts.length >= maxAttempts) {
      return false;
    }
    
    userAttempts.push(now);
    this.attempts.set(identifier, userAttempts);
    
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * FINTRAC-specific validation utilities
 */
export const FINTRACValidation = {
  /**
   * Check if transaction amount requires enhanced due diligence
   */
  requiresEnhancedDueDiligence(amount: number): boolean {
    return amount >= 10000; // CAD $10,000 threshold
  },

  /**
   * Check if transaction requires LCTR (Large Cash Transaction Report)
   */
  requiresLCTR(amount: number, paymentMethod: string): boolean {
    return amount >= 10000 && paymentMethod.toLowerCase().includes('cash');
  },

  /**
   * Validate occupation for compliance flags
   */
  isHighRiskOccupation(occupation: string): boolean {
    const highRiskOccupations = [
      'money service business',
      'casino',
      'real estate',
      'precious metals',
      'jewelry',
      'car dealer',
      'art dealer'
    ];
    
    const occ = occupation.toLowerCase();
    return highRiskOccupations.some(risk => occ.includes(risk));
  },

  /**
   * Check if customer country is high-risk
   */
  isHighRiskCountry(country: string): boolean {
    // This would be updated based on current FINTRAC guidelines
    const highRiskCountries = [
      'afghanistan',
      'iran',
      'north korea',
      'syria'
    ];
    
    return highRiskCountries.includes(country.toLowerCase());
  }
};

/**
 * Document validation utilities
 */
export const DocumentValidation = {
  /**
   * Validate that uploaded file is an acceptable document type
   */
  isValidDocumentType(fileName: string, mimeType: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const validMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    const hasValidExtension = validExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
    
    const hasValidMimeType = validMimeTypes.includes(mimeType);
    
    return hasValidExtension && hasValidMimeType;
  },

  /**
   * Check if file size is within acceptable limits
   */
  isValidFileSize(fileSize: number, maxSizeMB: number = 5): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return fileSize <= maxBytes && fileSize > 0;
  },

  /**
   * Generate document checksum for integrity verification
   */
  async generateDocumentChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};