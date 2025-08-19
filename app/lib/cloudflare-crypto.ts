/**
 * Cloudflare Workers compatible crypto utilities
 * This file provides crypto functions that work in Cloudflare Workers environment
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Create SHA1 hash compatible with Cloudflare Workers
 */
export async function createSHA1Hash(data: string): Promise<string> {
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create SHA256 hash compatible with Cloudflare Workers
 */
export async function createSHA256Hash(data: string): Promise<string> {
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create MD5 hash (not available in Cloudflare Workers, returns SHA1 as fallback)
 */
export async function createMD5Hash(data: string): Promise<string> {
  // MD5 is not available in Cloudflare Workers, use SHA1 as fallback
  return await createSHA1Hash(data);
}

/**
 * Generate random bytes
 */
export function getRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate random string
 */
export function getRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = getRandomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

/**
 * AES encryption using Web Crypto API
 */
export async function encryptAES(key: string, data: string): Promise<string> {
  const iv = getRandomBytes(16);
  const cryptoKey = await importAESKey(key);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, encoder.encode(data));

  const bundle = new Uint8Array(iv.length + ciphertext.byteLength);
  bundle.set(iv, 0);
  bundle.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...bundle));
}

/**
 * AES decryption using Web Crypto API
 */
export async function decryptAES(key: string, encryptedData: string): Promise<string> {
  const bundle = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  const iv = bundle.slice(0, 16);
  const ciphertext = bundle.slice(16);

  const cryptoKey = await importAESKey(key);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);

  return decoder.decode(plaintext);
}

/**
 * Import AES key for encryption/decryption
 */
async function importAESKey(key: string): Promise<CryptoKey> {
  const keyBuffer = encoder.encode(key);
  return await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']);
}
