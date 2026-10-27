import { MON, N, blank, yearIdx, asOf, lastFilled } from './util';
import { sum, sumTo, has } from './charts';

/* Warna dokter tetap di semua grafik. */
export const DOCS = {
  S: { name: 'dr. Syahnural', c: 'var(--s1)', on: 'var(--on-fill)' },
  R: { name: 'dr. Rina', c: 'var(--s2)', on: 'var(--on-fill)' },
  G: { name: 'dr. Gde', c: 'var(--s3)', on: 'var(--on-fill)' },
  H: { name: 'dr. Heryani', c: 'var(--s4)', on: 'var(--on-s4)' },
  E: { name: 'dr. Eddy', c: 'var(--s5)', on: 'var(--on-fill)' },
  A: { name: 'dr. Andy', c: 'var(--s6)', on: 'var(--on-fill)' },
  O: { name: 'Dokter lain', c: 'var(--other)', on: 'var(--on-fill)' },
};

const cat = (D, y) => (y === D.meta.year ? y + '*' : String(y));
const ttYear = (D, y) => 'Tahun ' + y + (y === D.meta.year ? ' (s.d. ' + MON[D.meta.month - 1] + ')' : '');
const annualVals = (D, o) => D.years.map((y) => (o[y] ? (y === D.meta.year ? sumTo(o[y], D.meta.month) : sum(o[y])) : N));
const partialNote = (D, o) => (has(o[D.meta.year]) ? `*${D.meta.year} sampai ${MON[D.meta.month - 1]}.` : `Data ${D.meta.year} belum diinput.`);

function lineMonthly(id, key, label, subTxt) {
  return {
    id, sec: 'kunjungan', kind: 'line',
    spec(D, Y) {
      const o = D[key];
      const p = Y - 1;
      const cur = o[Y] || blank();
      const pr = o[p] || blank();
      const nm = (yy, a) => String(yy) + (has(a) ? '' : ' (tidak ada data)');
      return {
        title: label,
        sub: has(cur) ? subTxt + ', ' + Y + ' dibanding ' + p : 'Data ' + Y + ' belum ada di spreadsheet. Pembanding: ' + p + '.',
        cats: MON,
        series: [{ name: nm(Y, cur), values: cur, color: 'var(--s1)' }, { name: nm(p, pr), values: pr, color: 'var(--s2)' }],
        aria: label + ' per bulan, ' + Y + ' dibanding ' + p,
      };
    },
  };
}

function annualCol(id, sec, key, label, base) {
  return {
    id, sec, kind: 'col',
    spec(D, Y) {
      const o = D[key];
      return {
        title: label,
        sub: (base ? base + ' ' : '') + partialNote(D, o),
        cats: D.years.map((y) => cat(D, y)),
        series: [{ name: label, values: annualVals(D, o), color: 'var(--s1)' }],
        hiX: yearIdx(D, Y), labelIdx: [yearIdx(D, Y)],
        tt: (i) => ttYear(D, D.years[i]),
        aria: label + ' per tahun', catHead: 'Tahun',
      };
    },
  };
}

export const CHARTS = [
  lineMonthly('kunj-bulan', 'visits', 'Kunjungan pasien per bulan', 'Visite patient'),
  annualCol('kunj-tahun', 'kunjungan', 'visits', 'Kunjungan pasien per tahun', '2017 mulai Maret.'),
  lineMonthly('nfp-bulan', 'nfp', 'Pasien baru (NFP) per bulan', 'New female patient'),
  annualCol('nfp-tahun', 'kunjungan', 'nfp', 'Pasien baru per tahun', ''),
  lineMonthly('konsul-bulan', 'konsulTotal', 'Konsultasi dokter per bulan', 'Tab Konsul Dokter'),

  {
    id: 'opu-bulan', sec: 'opu', kind: 'col', wide: true,
    spec(D, Y) {
      const a = D.opu[Y] || blank();
      const tg = D.opuTarget[Y] || null;
      return {
        title: 'OPU per bulan, ' + Y,
        sub: tg ? 'Garis hitam menandai target bulanan.' : 'Target bulanan untuk ' + Y + ' belum ada.',
        cats: MON, series: [{ name: 'OPU ' + Y, values: a, color: 'var(--s1)' }], targets: tg,
        legendExtra: tg ? [{ name: 'Target OPU' }] : null, height: 240,
        tt: (i) => MON[i] + ' ' + Y, aria: 'OPU per bulan ' + Y, catHead: 'Bulan',
      };
    },
  },
  annualCol('opu-tahun', 'opu', 'opu', 'OPU per tahun', ''),
  {
    id: 'opu-dokter', sec: 'opu', kind: 'col',
    spec(D, Y) {
      return {
        title: 'OPU per dokter per tahun',
        sub: 'Dokter dengan OPU kecil digabung di "Dokter lain" (dr. Eddy, dr. Andy, dr. Badarul).',
        cats: D.years.map((y) => cat(D, y)),
        series: ['S', 'R', 'G', 'H', 'O'].map((k) => ({ name: DOCS[k].name, values: D.opuDoc[k], color: DOCS[k].c })),
        hiX: yearIdx(D, Y), tt: (i) => ttYear(D, D.years[i]), aria: 'OPU per dokter per tahun', catHead: 'Tahun',
      };
    },
  },

  {
    id: 'tindakan-tahun', sec: 'hasil', kind: 'line', wide: true,
    spec(D, Y) {
      return {
        title: 'Tindakan per tahun',
        sub: `Jumlah tindakan tiap tahun. ${D.meta.year} sampai ${MON[D.meta.month - 1]}.`,
        cats: D.years.map((y) => cat(D, y)), height: 240,
        series: [
          { name: 'OPU', values: annualVals(D, D.opu), color: 'var(--s1)' },
          { name: 'FET', values: annualVals(D, D.fet), color: 'var(--s2)' },
          { name: 'IUI', values: annualVals(D, D.iui), color: 'var(--s3)' },
          { name: 'ET segar', values: annualVals(D, D.et), color: 'var(--s4)' },
        ],
        hiX: yearIdx(D, Y), tt: (i) => ttYear(D, D.years[i]), aria: 'Tindakan per tahun', catHead: 'Tahun',
      };
    },
  },
  {
    id: 'hamil-rate', sec: 'hasil', kind: 'line',
    spec(D, Y) {
      const pr = (o) => D.years.map((y, i) => (o.n[i] > 0 && o.preg[i] != null ? (o.preg[i] / o.n[i]) * 100 : N));
      return {
        title: 'Tingkat kehamilan per tindakan',
        sub: 'Kehamilan dibagi tindakan. Tahun berjalan baru terisi sebagian karena hasil tindakan terbaru belum masuk.',
        cats: D.years.map(String),
        series: [{ name: 'FET', values: pr(D.outc.fet), color: 'var(--s2)' }, { name: 'IUI', values: pr(D.outc.iui), color: 'var(--s3)' }],
        yfmt: (v) => v + '%', vfmt: (v) => Math.round(v) + '%', hiX: yearIdx(D, Y),
        aria: 'Tingkat kehamilan FET dan IUI per tahun', catHead: 'Tahun',
      };
    },
  },
  {
    id: 'bayi-lahir', sec: 'hasil', kind: 'col',
    spec(D, Y) {
      const o = D.outc;
      return {
        title: 'Bayi lahir per tahun',
        sub: `FET, ET segar, dan IUI. ${D.meta.year} belum ada karena kehamilannya masih berjalan.`,
        cats: D.years.map(String),
        series: [
          { name: 'FET', values: o.fet.born, color: 'var(--s2)' },
          { name: 'ET segar', values: o.et.born, color: 'var(--s4)' },
          { name: 'IUI', values: o.iui.born, color: 'var(--s3)' },
        ],
        hiX: yearIdx(D, Y), aria: 'Bayi lahir per tahun', catHead: 'Tahun',
      };
    },
  },

  {
    id: 'sumber', sec: 'pasien', kind: 'col', wide: true,
    spec(D) {
      const L = D.src;
      const groups = [];
      L.forEach((r, i) => {
        const g = groups[groups.length - 1];
        if (g && g.label === String(r.y)) g.to = i; else groups.push({ label: String(r.y), from: i, to: i });
      });
      const tc = L.map((r) => MON[r.m] + ' ' + r.y);
      const last = L[L.length - 1];
      return {
        title: 'Dari mana pasien OPU berasal',
        sub: L.length ? `Per bulan, ${L[0].y} sampai ${last ? MON[last.m] + ' ' + last.y : ''}, sesuai yang sudah diisi di tab Sumber Pasien.` : 'Belum ada data.',
        cats: L.map((r) => MON[r.m][0]), tcats: tc, height: 250, groups,
        series: [
          { name: 'Pasien baru (NFP)', values: L.map((r) => r.nfp), color: 'var(--s1)' },
          { name: 'Pasien lama (OFP)', values: L.map((r) => r.ofp), color: 'var(--s2)' },
          { name: 'Pasien gagal program sebelumnya', values: L.map((r) => r.fail), color: 'var(--s3)' },
        ],
        tt: (i) => tc[i], aria: 'Sumber pasien OPU per bulan', catHead: 'Bulan',
      };
    },
  },
  {
    id: 'domisili', sec: 'pasien', kind: 'h',
    spec(D) {
      const [a, b] = D.dom.years;
      const tot = (i) => D.dom.rows.reduce((x, r) => x + (r[i] || 0), 0);
      const top = D.dom.rows[0];
      const share = top && tot(2) ? Math.round((top[2] / tot(2)) * 100) : null;
      return {
        title: 'Domisili pasien OPU',
        sub: `Jumlah pasien per kabupaten atau kota, ${a} dan ${b}.` + (share != null ? ` ${top[0]} ${share}% pada ${b}.` : ''),
        mode: 'group', labelSeries: 1,
        series: [{ name: String(a), color: 'var(--s1soft)' }, { name: String(b), color: 'var(--s1)' }],
        rows: D.dom.rows.map((r) => ({ label: r[0], values: [r[1], r[2]] })),
        aria: `Domisili pasien OPU ${a} dan ${b}`, rowHead: 'Daerah',
      };
    },
  },
  {
    id: 'usia', sec: 'pasien', kind: 'col',
    spec(D) {
      const ys = Object.keys(D.age).map(Number).sort((x, y) => x - y);
      const col = (k) => ys.map((y) => D.age[y][k]);
      return {
        title: 'Usia pasien OPU',
        sub: `Porsi tiap kelompok usia per tahun, ${ys[0]} sampai ${ys[ys.length - 1]}.`,
        percent: true, cats: ys.map(String),
        series: [
          { name: 'Di bawah 35', values: col(0), color: 'var(--age1)' },
          { name: '35 sampai 37', values: col(1), color: 'var(--age2)' },
          { name: '38 sampai 40', values: col(2), color: 'var(--age3)' },
          { name: '41 ke atas', values: col(3), color: 'var(--age4)' },
        ],
        aria: 'Kelompok usia pasien OPU per tahun', catHead: 'Tahun',
      };
    },
  },

  {
    id: 'konsul-dokter', sec: 'dokter', kind: 'h',
    spec(D) {
      const ks = ['S', 'R', 'G', 'H', 'E', 'A'];
      const ys = Object.keys(D.konsulDoc).map(Number).sort((a, b) => a - b);
      const part = (y) => (y === D.meta.year ? ` (Jan–${MON[Math.max(1, lastFilled(D.konsulTotal[y])) - 1]})` : '');
      const lf = lastFilled(D.konsulTotal[D.meta.year]);
      return {
        title: 'Konsultasi per dokter',
        sub: 'Tab Konsul Dokter.' + (lf && lf < D.meta.month ? ` ${D.meta.year} baru sampai ${MON[lf - 1]}.` : ''),
        mode: 'stack',
        series: ks.map((k) => ({ name: DOCS[k].name, color: DOCS[k].c, on: DOCS[k].on })),
        rows: ys.map((y) => ({ label: String(y) + part(y), values: D.konsulDoc[y] })),
        aria: 'Konsultasi per dokter', rowHead: 'Periode',
      };
    },
  },
  {
    id: 'nfp-dokter', sec: 'dokter', kind: 'h',
    spec(D) {
      const ks = ['S', 'R', 'G', 'H', 'E', 'A'];
      const ys = Object.keys(D.nfpDoc).map(Number).sort((a, b) => a - b);
      return {
        title: 'Pasien baru per dokter',
        sub: 'Tab NFP, per tahun.', mode: 'stack',
        series: ks.map((k) => ({ name: DOCS[k].name, color: DOCS[k].c, on: DOCS[k].on })),
        rows: ys.map((y) => ({ label: y === D.meta.year ? `${y} (Jan–${MON[D.meta.month - 1]})` : String(y), values: D.nfpDoc[y] })),
        aria: 'Pasien baru per dokter', rowHead: 'Tahun',
      };
    },
  },
];

export function buildSpec(def, D, year) {
  return def.spec(D, year);
}

export function bornYear(D, y) {
  const i = yearIdx(D, y);
  if (i < 0) return null;
  const o = D.outc;
  // belum lengkap bila hasil FET atau IUI belum diisi (mis. tahun berjalan)
  if (o.fet.born[i] == null || o.iui.born[i] == null) return null;
  return sum([o.fet.born[i], o.et.born[i], o.iui.born[i]]);
}

export { asOf };
