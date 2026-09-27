/**
 * Zero-knowledge vault cryptography.
 *
 * Everything is encrypted ON THE DEVICE before it leaves the browser:
 *   password --PBKDF2-SHA256(600k, per-user salt)--> AES-256-GCM key
 *   state JSON --AES-256-GCM(random 96-bit IV)--> ciphertext (base64)
 *
 * The server stores only: salt, iv, ciphertext. It cannot read your data.
 * No external libraries — pure WebCrypto (works in every modern browser).
 */

const PBKDF2_ITERATIONS = 600_000;

export function b64FromBytes(bytes: Uint8Array<ArrayBuffer>): string {
  let out = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(out);
}

export function bytesFromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomB64(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return b64FromBytes(buf);
}

/** Derive the vault encryption key from the account password. */
export async function deriveVaultKey(password: string, saltB64: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bytesFromB64(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so the device can persist it after unlock
    ['encrypt', 'decrypt'],
  );
}

export async function exportKeyB64(key: CryptoKey): Promise<string> {
  return b64FromBytes(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
}

export async function importKeyB64(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytesFromB64(b64), { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);
}

export interface SealedPayload {
  iv: string;
  data: string;
}

/** Encrypt a JSON string; output is base64(iv) + base64(ciphertext). */
export async function encryptJson(key: CryptoKey, json: string): Promise<SealedPayload> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(json),
  );
  return { iv: b64FromBytes(iv), data: b64FromBytes(new Uint8Array(ct)) };
}

/** Decrypt a sealed payload back to the original JSON string. */
export async function decryptJson(key: CryptoKey, payload: SealedPayload): Promise<string> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesFromB64(payload.iv) },
    key,
    bytesFromB64(payload.data),
  );
  return new TextDecoder().decode(pt);
}
