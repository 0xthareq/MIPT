'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { COOKIE, createToken, credentials, safeEqual } from '../../lib/token';
import { getSession } from '../../lib/session';
import { getData } from '../../lib/sync';

/* Pembatas percobaan login per IP (best effort: memori per instance serverless). */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 6;

function blocked(ip) {
  const a = attempts.get(ip);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) { attempts.delete(ip); return false; }
  return a.count >= MAX_FAILS;
}
function fail(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else a.count += 1;
  if (attempts.size > 500) attempts.clear();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function login(_prev, formData) {
  const cfg = credentials();
  if (!cfg) {
    return { error: 'Server belum dikonfigurasi. Isi DASHBOARD_USERNAME, DASHBOARD_PASSWORD, dan SESSION_SECRET (minimal 32 karakter) di environment variable.' };
  }
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (blocked(ip)) return { error: 'Terlalu banyak percobaan. Coba lagi sekitar 15 menit.' };

  const u = String(formData.get('username') || '').slice(0, 200);
  const p = String(formData.get('password') || '').slice(0, 200);
  const okUser = safeEqual(u, cfg.username);
  const okPass = safeEqual(p, cfg.password);
  if (!(okUser && okPass)) {
    fail(ip);
    await sleep(700);
    return { error: 'Username atau password salah.' };
  }
  attempts.delete(ip);
  const store = await cookies();
  store.set(COOKIE, await createToken(cfg), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // tanpa maxAge/expires: cookie sesi, hilang saat browser ditutup
  });
  redirect('/');
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE);
  redirect('/login');
}

export async function refreshData() {
  const s = await getSession();
  if (!s) redirect('/login');
  await getData({ force: true });
  revalidatePath('/', 'layout');
}
