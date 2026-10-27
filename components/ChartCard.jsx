'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildSpec } from '../lib/specs';
import { drawLine, drawCol, drawH, hideTip, fmt, sum } from '../lib/charts';

const DRAW = { line: drawLine, col: drawCol, h: drawH };

function Legend({ spec, kind }) {
  const extra = spec.legendExtra || [];
  if (spec.series.length < 2 && !extra.length) return null;
  return (
    <div className="legend">
      {spec.series.map((q) => (
        <span className="lg" key={q.name}>
          <span className={'key ' + (kind === 'line' ? 'line' : 'box')} style={{ background: q.color }} />
          <span>{q.name}</span>
        </span>
      ))}
      {extra.map((x) => (
        <span className="lg" key={x.name}>
          <span className="key tick" />
          <span>{x.name}</span>
        </span>
      ))}
    </div>
  );
}

function DataTable({ spec, kind }) {
  const isH = kind === 'h';
  const stacked = spec.series.length > 1 && (kind === 'col' || spec.mode === 'stack');
  const f = spec.tfmt || spec.vfmt || fmt;
  const rows = isH
    ? spec.rows.map((r) => ({ label: r.label, vals: r.values }))
    : spec.cats.map((c, i) => ({
        label: (spec.tcats || spec.cats)[i],
        vals: spec.series.map((q) => q.values[i]),
        i,
      }));
  return (
    <div className="tscroll">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">{spec.catHead || (isH ? spec.rowHead || '' : 'Periode')}</th>
            {spec.series.map((q) => (
              <th scope="col" key={q.name}>{q.name}</th>
            ))}
            {stacked && <th scope="col">Total</th>}
            {spec.targets && <th scope="col">Target</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              {r.vals.map((v, k) => (
                <td key={k}>{v == null ? '–' : f(v)}</td>
              ))}
              {stacked && <td>{fmt(sum(r.vals))}</td>}
              {spec.targets && <td>{spec.targets[r.i] == null ? '–' : fmt(spec.targets[r.i])}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChartCard({ def, D, year }) {
  const spec = useMemo(() => buildSpec(def, D, year), [def, D, year]);
  const [tmode, setTmode] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || tmode) return;
    let last = 0;
    const paint = () => {
      const w = Math.floor(box.clientWidth);
      if (!w) return;
      last = w;
      box.replaceChildren(DRAW[def.kind](spec, w));
    };
    paint();
    const ro = new ResizeObserver(() => {
      if (Math.floor(box.clientWidth) !== last) paint();
    });
    ro.observe(box);
    return () => {
      ro.disconnect();
      hideTip();
    };
  }, [spec, def.kind, tmode]);

  return (
    <article className={'card' + (def.wide ? ' wide' : '')}>
      <div className="chead">
        <div>
          <h3>{spec.title}</h3>
          <p className="csub">{spec.sub || ''}</p>
        </div>
        <button
          type="button"
          className="tbtn"
          aria-pressed={tmode}
          onClick={() => {
            hideTip();
            setTmode((v) => !v);
          }}
        >
          {tmode ? 'Grafik' : 'Tabel'}
        </button>
      </div>
      <Legend spec={spec} kind={def.kind} />
      {tmode ? (
        <div className="cbox">
          <DataTable spec={spec} kind={def.kind} />
        </div>
      ) : (
        <div className="cbox" ref={boxRef} />
      )}
    </article>
  );
}
