/**
 * NEXUS Device Lock — WebAuthn passkeys as the zero-third-party OTP.
 *
 * Why this instead of emailed/SMS'd one-time codes: delivering a code needs an
 * SMTP relay or an SMS gateway — both are third-party services this project is
 * forbidden to use. A passkey challenge is the same idea done locally: the
 * browser signs a one-time random challenge with a device-bound key and asks
 * for your fingerprint / face / PIN / Windows Hello to release it. It works
 * with every email provider (Gmail, ProtonMail, Yahoo, …), every country's
 * phone number, and every GitHub account, because the identity is only a
 * label — the factor lives on the device. It is also faster than typing 6
 * digits and cannot be phished (the signature is origin-bound).
 *
 * Stored in the account record (public material only):
 *   pk.credId   base64url credential id
 *   pk.pub      SPKI DER public key, base64
 *   pk.backup   PBKDF2 hash of a one-time backup code (recovery path)
 * Nothing secret ever reaches the repository.
 */

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function bytesToB64url(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63] + B64URL[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63];
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63];
  }
  return out;
}

export function b64urlToBytes(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = B64URL.indexOf(ch);
    if (v < 0) continue;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** TS 5.7 BufferSource narrowing — Uint8Array is binary-compatible. */
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

/** True when this browser can do WebAuthn create + export the public key. */
export function passkeyAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.navigator?.credentials) return false;
    return typeof window.PublicKeyCredential === 'function';
  } catch {
    return false;
  }
}

/** Extra check used before offering enrollment (device can verify the user). */
export async function passkeyReady(): Promise<boolean> {
  try {
    if (!passkeyAvailable()) return false;
    const ok = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return ok === true;
  } catch {
    return false;
  }
}

export interface PasskeyCredential {
  credId: string;
  pub: string;
}

function pickAlg(): { type: 'public-key'; alg: number }[] {
  return [{ type: 'public-key', alg: -7 }]; // ES256 — universally supported
}

/**
 * Prompt the user (fingerprint / face / PIN) and export the new credential.
 * Throws on cancel or when the browser cannot export the public key.
 */
export async function createPasskey(userId: string, display: string): Promise<PasskeyCredential> {
  if (!passkeyAvailable()) throw new Error('Device lock is not available in this browser.');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: bs(challenge),
      rp: { name: 'MAKAUT NEXUS' },
      user: {
        id: bs(utf8(userId)),
        name: display.slice(0, 64) || 'nexus-user',
        displayName: display.slice(0, 64) || 'nexus-user',
      },
      pubKeyCredParams: pickAlg(),
      authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
      timeout: 15_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Device lock setup was cancelled.');
  const resp = cred.response as AuthenticatorAttestationResponse;
  const getPub = (resp as unknown as { getPublicKey?: () => ArrayBuffer | null }).getPublicKey;
  if (typeof getPub !== 'function') throw new Error('This browser cannot export passkey keys.');
  const spki = getPub.call(resp);
  if (!spki) throw new Error('Device lock setup failed — no key returned.');
  return {
    credId: bytesToB64url(new Uint8Array(cred.rawId)),
    pub: bytesToB64url(new Uint8Array(spki)),
  };
}

export interface AssertionParts {
  clientData: Uint8Array;
  authData: Uint8Array;
  sig: Uint8Array;
  /** base64url challenge we issued — must be echoed back by the authenticator */
  challenge: string;
}

/**
 * One-time challenge: ask the device to sign. Throws on cancel/timeout.
 * Returns raw parts for verifyAssertion().
 */
export async function assertPasskey(credId: string): Promise<AssertionParts> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: bs(challenge),
      allowCredentials: [{ type: 'public-key', id: bs(b64urlToBytes(credId)) }],
      userVerification: 'required',
      timeout: 15_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Device check was cancelled.');
  const resp = cred.response as AuthenticatorAssertionResponse;
  return {
    clientData: new Uint8Array(resp.clientDataJSON),
    authData: new Uint8Array(resp.authenticatorData),
    sig: new Uint8Array(resp.signature),
    challenge: bytesToB64url(challenge),
  };
}

/** DER (SEQUENCE of two INTEGERs) → fixed-width r||s (WebCrypto format). */
function derToRaw(der: Uint8Array): Uint8Array | null {
  try {
    let p = 0;
    if (der[p++] !== 0x30) return null;
    p++; // total length (short form assumed — ECDSA-SHA256 DER is <128 bytes... actually can be 70-72)
    let len = der[p - 1];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let i = 0; i < n; i++) len = (len << 8) | der[p++];
    }
    const readInt = (): Uint8Array | null => {
      if (der[p++] !== 0x02) return null;
      let l = der[p++];
      let pad = 0;
      while (l > 0 && der[p] === 0) { p++; l--; pad++; }
      if (l > 32) return null;
      const v = new Uint8Array(32);
      v.set(der.subarray(p, p + l), 32 - l);
      p += l;
      void pad;
      return v;
    };
    const r = readInt();
    const s = readInt();
    if (!r || !s) return null;
    const out = new Uint8Array(64);
    out.set(r, 0);
    out.set(s, 32);
    return out;
  } catch {
    return null;
  }
}

/**
 * Verify an assertion against the stored public key. Pure function — unit
 * tested in Node. Checks challenge echo, type, origin (browser), rpId hash
 * (browser), UP+UV flags, and the ES256 signature over
 * authData || SHA-256(clientDataJSON).
 */
export async function verifyAssertion(
  _credId: string,
  pubB64: string,
  parts: AssertionParts,
): Promise<boolean> {
  try {
    // 1. clientDataJSON: type + challenge echo + origin
    const client = JSON.parse(new TextDecoder().decode(parts.clientData)) as {
      type?: string; challenge?: string; origin?: string;
    };
    if (client.type !== 'webauthn.get') return false;
    if (client.challenge !== parts.challenge || !client.challenge) return false;
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (client.origin !== window.location.origin) return false;
    }
    // 2. authData: UP (0x01) + UV (0x10) must be set
    if (parts.authData.length < 37) return false;
    const flags = parts.authData[32];
    if ((flags & 0x11) !== 0x11) return false;
    // 3. rpId hash (browser only): must equal SHA-256(current host)
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const rpHash = new Uint8Array(
        await crypto.subtle.digest('SHA-256', bs(utf8(window.location.hostname))),
      );
      for (let i = 0; i < 32; i++) if (parts.authData[i] !== rpHash[i]) return false;
    }
    // 4. signature over authData || SHA-256(clientDataJSON)
    const clientHash = new Uint8Array(await crypto.subtle.digest('SHA-256', bs(parts.clientData)));
    const signed = new Uint8Array(parts.authData.length + 32);
    signed.set(parts.authData, 0);
    signed.set(clientHash, parts.authData.length);
    const raw = derToRaw(parts.sig);
    if (!raw) return false;
    const key = await crypto.subtle.importKey(
      'spki', b64urlToBytes(pubB64) as unknown as BufferSource,
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
    );
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, key, raw as unknown as BufferSource,
      signed as unknown as BufferSource,
    );
  } catch {
    return false;
  }
}

/** Human-friendly recovery code: XXXXX-XXXXX (no ambiguous characters). */
const BACKUP_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

export function generateBackupCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let s = '';
  for (const b of bytes) s += BACKUP_ALPHABET[b % BACKUP_ALPHABET.length];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}

export function normalizeBackupCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length === 10 ? `${s.slice(0, 5)}-${s.slice(5)}` : raw.trim().toUpperCase();
}
