/* NEXUS AUTH v2 — GitHub / email / phone identities, zero third parties. */
/**
 * Privacy rules enforced here (nothing below may ever be stored):
 *   - passwords        → PBKDF2-SHA256 (600k, per-record salt), hash only
 *   - emails / phones  → deterministic keyed id (PBKDF2 over a fixed salt)
 *                        + masked display string; plaintext never persisted
 *   - GitHub login      → user's own PAT, verified against api.github.com
 *   - Google sign-in    → EXCLUDED on purpose: needs a third-party Google
 *                         Cloud console account (project forbids third parties)
 *   - SMS OTP           → EXCLUDED on purpose: needs a third-party SMS gateway
 */
import { bytesFromB64 } from './crypto';

export type AuthMethod = 'github' | 'email' | 'phone';

const PBKDF2_ITERS = 600_000;
const IDENTITY_SALT = new TextEncoder().encode('nexus-repodb-identity-v1-7c1f9a4e');

export interface GithubProfile {
  login: string;
  id: number;
}

function hexOf(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function pbkdf2Hex(secret: string, salt: BufferSource, iters: number): Promise<string> {
  const mat = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iters, hash: 'SHA-256' },
    mat,
    256,
  );
  return hexOf(bits);
}

/** Deterministic, non-reversible account id for an email/phone/github identity. */
export async function identityId(method: AuthMethod, value: string): Promise<string> {
  return (await pbkdf2Hex(`${method}:${value}`, IDENTITY_SALT, PBKDF2_ITERS)).slice(0, 32);
}

/** Salted password hash — the plaintext password is never stored anywhere. */
export async function passwordHash(password: string, saltB64: string): Promise<string> {
  return pbkdf2Hex(password, bytesFromB64(saltB64), PBKDF2_ITERS);
}

/** Verify a token against GitHub; throws with a readable message on failure. */
export async function verifyGithub(
  pat: string,
  apiBase = 'https://api.github.com',
): Promise<GithubProfile> {
  let res: Response;
  try {
    res = await fetch(`${apiBase.replace(/\/+$/, '')}/user`, {
      headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new Error('Cannot reach GitHub — check your internet connection.');
  }
  if (res.status === 401) {
    throw new Error('GitHub rejected that token — copy it again from github.com/settings/tokens.');
  }
  if (!res.ok) throw new Error(`GitHub said HTTP ${res.status} — try again.`);
  const j = (await res.json()) as { login?: string; id?: number };
  if (!j.login || typeof j.id !== 'number') throw new Error('GitHub returned no profile.');
  return { login: String(j.login), id: Number(j.id) };
}

export function normalizeEmail(raw: string): string {
  const e = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('Enter a valid email address.');
  return e;
}

/** Build an E.164-style number: dial code (e.g. +91) + digits, 7–15 digits total. */
export function normalizePhone(dial: string, raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  const d = dial.replace(/[^0-9]/g, '');
  const e164 = `+${d}${digits}`;
  const total = d.length + digits.length;
  if (digits.length < 4 || total < 7 || total > 15) {
    throw new Error('Enter a valid phone number for the selected country.');
  }
  return e164;
}

/** Masked display: "jo***@gm***.com" — the stored form of an email identity. */
export function maskEmail(e: string): string {
  const [user = '', domain = ''] = e.split('@');
  const tld = domain.includes('.') ? `.${domain.split('.').pop()}` : '';
  const dom = domain.includes('.') ? domain.slice(0, domain.length - tld.length) : domain;
  return `${user.slice(0, 2)}***@${dom.slice(0, 2)}***${tld}`;
}

/** Masked display: "+91•••••7890" — the stored form of a phone identity. */
export function maskPhone(e164: string): string {
  const head = e164.slice(0, 3);
  const tail = e164.slice(-3);
  return `${head}•••••${tail}`;
}
