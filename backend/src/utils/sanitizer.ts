/**
 * Sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize a string to prevent XSS attacks
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove control characters except newline, carriage return, and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitize SQL input to prevent SQL injection
 * Note: This is a secondary defense. Always use parameterized queries as primary defense
 */
export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove SQL comment sequences
  let sanitized = input.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');

  // Remove semicolons (statement terminators)
  sanitized = sanitized.replace(/;/g, '');

  // Remove common SQL injection patterns
  sanitized = sanitized.replace(/(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi, '');
  sanitized = sanitized.replace(/\bUNION\b.*\bSELECT\b/gi, '');
  sanitized = sanitized.replace(/\bDROP\b.*\bTABLE\b/gi, '');
  sanitized = sanitized.replace(/\bINSERT\b.*\bINTO\b/gi, '');
  sanitized = sanitized.replace(/\bDELETE\b.*\bFROM\b/gi, '');
  sanitized = sanitized.replace(/\bUPDATE\b.*\bSET\b/gi, '');

  return sanitized;
}

/**
 * Sanitize file path to prevent directory traversal attacks
 */
export function sanitizeFilePath(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove directory traversal patterns
  let sanitized = input.replace(/\.\./g, '');
  sanitized = sanitized.replace(/\\/g, '/'); // Normalize path separators

  // Remove leading slashes to prevent absolute path access
  sanitized = sanitized.replace(/^\/+/, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitize URL to prevent SSRF and open redirect attacks
 */
export function sanitizeURL(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  try {
    const url = new URL(input);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Prevent localhost and private IP access
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      throw new Error('Private IP or localhost not allowed');
    }

    return url.toString();
  } catch (error) {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Convert to lowercase and trim
  let sanitized = input.toLowerCase().trim();

  // Remove any characters that are not valid in email addresses
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');

  return sanitized;
}

/**
 * Sanitize object recursively
 */
export function sanitize(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitize(item));
  }

  if (typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitize(input[key]);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJSON(input: string): any {
  try {
    const parsed = JSON.parse(input);
    return sanitize(parsed);
  } catch (error) {
    throw new Error('Invalid JSON input');
  }
}

/**
 * Remove potentially dangerous HTML tags and attributes
 */
export function stripDangerousHTML(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

  // Remove embed tags
  sanitized = sanitized.replace(/<embed\b[^<]*>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Validate input length
 */
export function validateLength(
  input: string,
  minLength: number,
  maxLength: number
): { valid: boolean; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  if (input.length < minLength) {
    return { valid: false, error: `Input must be at least ${minLength} characters` };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `Input must not exceed ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Check for common injection patterns
 */
export function containsInjectionPattern(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /\bUNION\b.*\bSELECT\b/i,
    /\bDROP\b.*\bTABLE\b/i,
    /\.\.\//,
    /\0/,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i,
  ];

  return injectionPatterns.some(pattern => pattern.test(input));
}
