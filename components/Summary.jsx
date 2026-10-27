import { MON, asOf, perLabel } from '../lib/util';
import { fmt, sum, sumTo, has } from '../lib/charts';
import { bornYear } from '../lib/specs';

function Hero({ D, year }) {
  const m = asOf(D, year);
  const act = sumTo(D.opu[year], m);
  const tg = D.opuTarget[year];
  let right;
  if (tg && act != null) {
    const ty = sum(tg);
    const tm = sumTo(tg, m);
    const pm = tm ? (act / tm) * 100 : 0;
    const py = ty ? (act / ty) * 100 : 0;
    right = (
      <div>
        <div className="lab">Capaian terhadap target</div>
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={ty} aria-valuenow={act} aria-label="OPU terhadap target tahunan">
          <div className="fill" style={{ width: Math.min(100, py) + '%' }} />
          <div className="mark" style={{ left: 'calc(' + Math.min(100, ty ? (tm / ty) * 100 : 0) + '% - 1px)' }} title={'Target s.d. ' + MON[m - 1]} />
        </div>
        <div className="mtxt">
          <div>{Math.round(pm)}% dari target s.d. {MON[m - 1]} ({fmt(tm)})</div>
          <span>{Math.round(py)}% dari target setahun ({fmt(ty)}). Garis hitam di bilah menandai target s.d. {MON[m - 1]}.</span>
        </div>
      </div>
    );
  } else {
    right = <div className="lab">Target OPU untuk {year} belum ada di spreadsheet.</div>;
  }
  return (
    <div className="card hero">
      <div>
        <div className="lab">Siklus OPU</div>
        <div className="big">{fmt(act)}</div>
        <div className="per">{perLabel(year, m)}</div>
      </div>
      {right}
    </div>
  );
}

function Kpis({ D, year }) {
  const m = asOf(D, year);
  const p = year - 1;
  const per = perLabel(p, m);
  const cy = D.meta.year;
  const ytd = (o, yy) => (has(o[yy]) ? sumTo(o[yy], m) : null);
  const zeroTail = (o) => {
    if (year !== cy || !o[cy]) return false;
    let k = 0;
    for (let i = m - 1; i >= 0 && o[cy][i] === 0; i--) k++;
    return k >= 2 ? k : false;
  };
  const iuiZero = zeroTail(D.iui);
  const tiles = [
    { l: 'Kunjungan pasien', cur: ytd(D.visits, year), prev: ytd(D.visits, p), none: 'Belum diinput' },
    { l: 'Pasien baru (NFP)', cur: ytd(D.nfp, year), prev: ytd(D.nfp, p) },
    { l: 'Siklus OPU', cur: ytd(D.opu, year), prev: ytd(D.opu, p) },
    { l: 'Transfer beku (FET)', cur: ytd(D.fet, year), prev: ytd(D.fet, p) },
    { l: 'IUI', cur: ytd(D.iui, year), prev: ytd(D.iui, p), flag: iuiZero ? `${iuiZero} bulan terakhir tercatat 0, cek input` : null },
    { l: 'Bayi lahir', cur: bornYear(D, year), prev: bornYear(D, p), full: true, none: 'Menunggu hasil' },
  ];
  return (
    <div className="kpis">
      {tiles.map((t) => {
        let d;
        if (t.cur != null && t.prev > 0) {
          const dv = ((t.cur - t.prev) / t.prev) * 100;
          const up = dv >= 0;
          d = (
            <div className={'d ' + (up ? 'up' : 'dn')}>
              <b>{(up ? '▲ +' : '▼ −') + Math.abs(Math.round(dv)) + '%'}</b> dibanding {t.full ? String(p) : per}
            </div>
          );
        } else if (t.cur == null) d = <div className="d">{t.none || 'Belum ada data'}</div>;
        else d = <div className="d">{t.full ? 'Sepanjang ' + year : perLabel(year, m)}</div>;
        return (
          <div className="kpi" key={t.l}>
            <div className="l">{t.l}</div>
            <div className="v">{t.cur == null ? '—' : fmt(t.cur)}</div>
            {d}
            {t.flag && <span className="flag">{t.flag}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Summary({ D, year }) {
  const m = asOf(D, year);
  return (
    <>
      <p className="sub inline">
        Periode pembanding: {perLabel(year - 1, m)}.{year === D.meta.year ? ` ${MON[m - 1]} masih berjalan.` : ''}
      </p>
      <Hero D={D} year={year} />
      <Kpis D={D} year={year} />
    </>
  );
}
