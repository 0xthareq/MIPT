import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { getSession } from '../../lib/session';
import { credentials } from '../../lib/token';

export const metadata = { title: 'Masuk · Dasbor MIPT' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  return <LoginForm configured={!!credentials()} />;
}
