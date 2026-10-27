import { timingSafeEqual, createHash } from 'node:crypto';

export const COOKIE = 'mipt_session';

const enc = new TextEncoder();

export function secret() {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function credentials() {
  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;
  if (!username || !password || !secret()) return null;
  return { username, password };
}

export function sessionHours() {
  const h = parseFloat(process.env.SESSION_HOURS || '');
  return h > 0 && h <= 72 ? h : 8;
}

async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Buffer.from(await crypto.subtle.sign('HMAC', k, enc.encode(data))).toString('base64url');
}

/** Perbandingan waktu-konstan lewat hash SHA-256 (panjang input tidak bocor). */
export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

/** Penanda password: mengganti password di env otomatis mematikan semua sesi lama. */
async function pv(cfg) {
  return (await hmac(secret(), 'pv:' + cfg.password)).slice(0, 12);
}

export async function createToken(cfg) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ u: cfg.username, iat: now, exp: now + Math.round(sessionHours() * 3600), pv: await pv(cfg) })).toString('base64url');
  return payload + '.' + (await hmac(secret(), payload));
}

export async function verifyToken(token) {
  const cfg = credentials();
  if (!cfg || !token || typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = await hmac(secret(), payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!data || typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null;
  if (data.u !== cfg.username || data.pv !== (await pv(cfg))) return null;
  return { user: data.u, exp: data.exp };
}
