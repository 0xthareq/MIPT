import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, verifyToken } from './token';
import { getData } from './sync';

export async function getSession() {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

/** Dipanggil di setiap halaman dan setiap akses data (jangan hanya mengandalkan proxy). */
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

export async function loadDashboardData() {
  const session = await requireSession();
  const data = await getData();
  return { session, data };
}
