import AppShell from './AppShell';
import { MENU } from '../lib/menu';

export function parseYear(raw, D) {
  const y = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
  return D.years.includes(y) ? y : D.meta.year;
}

export default function PageFrame({ D, session, year, active, children }) {
  const item = MENU.find((m) => m.id === active);
  return (
    <AppShell active={active} year={year} years={D.years} curYear={D.meta.year} meta={D.meta} user={session.user}>
      <div className="phead">
        <h1>{item.id === 'ringkasan' ? 'Ringkasan ' + year : item.title}</h1>
        <p className="sub">{item.sub}</p>
      </div>
      {children}
    </AppShell>
  );
}
