'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icons';
import { MENU } from '../lib/menu';
import { logout, refreshData } from '../app/login/actions';

const SOURCE = {
  sheet: { cls: 'ok', text: 'Terhubung ke Google Sheet' },
  sebagian: { cls: 'warn', text: 'Sebagian memakai data cadangan' },
  cadangan: { cls: 'bad', text: 'Sheet tidak terbaca, data cadangan' },
};

export default function AppShell({ active, year, years, curYear, meta, user, children }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const path = usePathname();
  const item = MENU.find((m) => m.id === active) || MENU[0];
  const q = year === curYear ? '' : '?tahun=' + year;
  const src = SOURCE[meta.source] || SOURCE.cadangan;

  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups = [];
  MENU.forEach((m) => {
    let g = groups.find((x) => x.name === m.group);
    if (!g) { g = { name: m.group, items: [] }; groups.push(g); }
    g.items.push(m);
  });

  return (
    <div className="shell">
      <aside className={'sidebar' + (open ? ' open' : '')} aria-label="Menu utama">
        <div className="brand">
          <span className="logo" aria-hidden="true">M</span>
          <div>
            <div className="bname">MIPT</div>
            <div className="bsub">Dasbor pasien</div>
          </div>
          <button type="button" className="iconbtn only-mobile" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <Icon name="x" />
          </button>
        </div>

        <nav className="menu">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="mlabel">{g.name}</div>
              {g.items.map((m) => (
                <Link
                  key={m.id}
                  href={m.href + q}
                  className={'mitem' + (m.id === active ? ' active' : '')}
                  aria-current={m.id === active ? 'page' : undefined}
                >
                  <Icon name={m.icon} />
                  <span>{m.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidefoot">
          <div className="sync" title={meta.warnings.join('\n')}>
            <span className={'dot ' + src.cls} aria-hidden="true" />
            <div>
              <div className="stext">{src.text}</div>
              <div className="ssub">Sinkron {meta.syncedLabel}</div>
            </div>
          </div>
          <div className="frow">
            <button
              type="button"
              className="fbtn"
              disabled={pending}
              onClick={() => start(async () => { await refreshData(); router.refresh(); })}
            >
              <Icon name="refresh" size={16} />
              <span>{pending ? 'Menyegarkan…' : 'Segarkan'}</span>
            </button>
            <form action={logout}>
              <button type="submit" className="fbtn">
                <Icon name="logout" size={16} />
                <span>Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="iconbtn only-mobile" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Icon name="menu" />
          </button>
          <span className="chip"><Icon name={item.icon} size={15} />{item.label}</span>
          <div className="tright">
            <label className="filter">
              <span>Tahun</span>
              <select
                value={year}
                onChange={(e) => {
                  const y = parseInt(e.target.value, 10);
                  router.push(item.href + (y === curYear ? '' : '?tahun=' + y));
                }}
              >
                {years.slice().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <span className="avatar" title={user} aria-label={'Masuk sebagai ' + user}>{String(user).slice(0, 1).toUpperCase()}</span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
