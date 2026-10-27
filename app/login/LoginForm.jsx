'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginForm({ configured }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <div className="login-wrap">
      <form className="login-card" action={action}>
        <div className="login-brand">
          <span className="logo" aria-hidden="true">M</span>
          <div>
            <h1>Dasbor Pasien MIPT</h1>
            <p>Masuk untuk melihat data.</p>
          </div>
        </div>

        {!configured && (
          <p className="login-error" role="alert">
            Server belum dikonfigurasi. Isi DASHBOARD_USERNAME, DASHBOARD_PASSWORD, dan SESSION_SECRET di environment variable.
          </p>
        )}

        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" required autoFocus maxLength={200} />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={200} />

        {state?.error && <p className="login-error" role="alert">{state.error}</p>}

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
