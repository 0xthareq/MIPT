import { fmt, sum, pctTxt } from '../lib/charts';
import { MON } from '../lib/util';

export function OutcomeTable({ D }) {
  const YEARS = D.years;
  const cy = D.meta.year;
  const o = D.outc;
  const groups = ['fet', 'et', 'iui'];
  const names = { fet: 'FET', et: 'ET segar', iui: 'IUI' };
  const cols = ['Tindakan', 'Hamil', 'Lahir', 'Hamil/tindakan'];
  return (
    <article className="card wide">
      <div className="chead">
        <div>
          <h3>Rekap hasil per tahun</h3>
          <p className="csub">
            *{cy} sampai {MON[D.meta.month - 1]}. Hasil kehamilan dan kelahiran tahun berjalan belum final, jadi persentasenya cenderung rendah.
            Satu kehamilan bisa menghasilkan lebih dari satu bayi.
          </p>
        </div>
      </div>
      <div className="cbox">
        <div className="tscroll">
          <table className="tbl">
            <thead>
              <tr>
                <th rowSpan={2}>Tahun</th>
                {groups.map((g) => (
                  <th className="gh" colSpan={4} key={g}>{names[g]}</th>
                ))}
              </tr>
              <tr>
                {groups.flatMap((g) => cols.map((c) => <th scope="col" key={g + c}>{c}</th>))}
              </tr>
            </thead>
            <tbody>
              {YEARS.map((y, i) => (
                <tr className={y === cy ? 'prov' : ''} key={y}>
                  <th scope="row">{y === cy ? y + '*' : y}</th>
                  {groups.flatMap((g) => {
                    const n = o[g].n[i], pg = o[g].preg[i], b = o[g].born[i];
                    return [
                      <td key={g + 'n'}>{fmt(n)}</td>,
                      <td key={g + 'p'}>{fmt(pg)}</td>,
                      <td key={g + 'b'}>{b == null ? '–' : fmt(b)}</td>,
                      <td key={g + 'r'}>{n > 0 ? pctTxt((pg / n) * 100) : '–'}</td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                {groups.flatMap((g) => {
                  const n = sum(o[g].n), pg = sum(o[g].preg), b = sum(o[g].born);
                  return [
                    <td key={g + 'n'}>{fmt(n)}</td>,
                    <td key={g + 'p'}>{fmt(pg)}</td>,
                    <td key={g + 'b'}>{fmt(b)}</td>,
                    <td key={g + 'r'}>{pctTxt((pg / n) * 100)}</td>,
                  ];
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </article>
  );
}

export function EmbryologistTable({ D }) {
  const e = D.emb;
  const colTot = (m) => e.names.map((_, k) => e[m].reduce((a, r) => a + r[k], 0));
  const ts = colTot('sa');
  const td = colTot('dfi');
  return (
    <article className="card wide">
      <div className="chead">
        <div>
          <h3>Pemeriksaan per embriolog</h3>
          <p className="csub">
            Jumlah pemeriksaan SA dan DFI menurut inisial embriolog, per periode seperti tercatat di tab Produktivitas.
          </p>
        </div>
      </div>
      <div className="cbox">
        <div className="tscroll">
          <table className="tbl">
            <thead>
              <tr>
                <th rowSpan={2}>Tahun</th>
                <th className="gh" colSpan={5}>Analisis semen (SA)</th>
                <th className="gh" colSpan={5}>DNA fragmentation index (DFI)</th>
              </tr>
              <tr>
                {[0, 1].flatMap((g) => [
                  ...e.names.map((n) => <th scope="col" key={g + n}>{n}</th>),
                  <th scope="col" key={g + 'tot'}>Total</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {e.years.map((y, i) => (
                <tr key={y}>
                  <th scope="row">{y}</th>
                  {e.sa[i].map((v, k) => <td key={'s' + k}>{fmt(v)}</td>)}
                  <td>{fmt(sum(e.sa[i]))}</td>
                  {e.dfi[i].map((v, k) => <td key={'d' + k}>{fmt(v)}</td>)}
                  <td>{fmt(sum(e.dfi[i]))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                {ts.map((v, k) => <td key={'s' + k}>{fmt(v)}</td>)}
                <td>{fmt(sum(ts))}</td>
                {td.map((v, k) => <td key={'d' + k}>{fmt(v)}</td>)}
                <td>{fmt(sum(td))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </article>
  );
}
