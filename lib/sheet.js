/*
 * Parser Google Sheet "TOTAL PASIEN TINDAKAN MIPT".
 * Murni fungsi (tanpa I/O): terima grid 2D (hasil CSV) dan keluarkan angka agregat.
 * Pencarian berbasis label, bukan nomor baris, jadi tahan terhadap baris yang bergeser.
 * Tab pasien (OPU, NFP) ikut diunduh, tetapi hanya blok rekap di sisi kanan/atas yang dibaca;
 * kolom nama dan RM tidak pernah disentuh.
 */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const DOC_KEYS = ['S', 'R', 'G', 'H', 'E', 'A'];

/* ---------- CSV ---------- */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (ch !== '\r') cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/* ---------- util sel ---------- */
const cell = (g, r, c) => (g[r] && g[r][c] != null ? String(g[r][c]).trim() : '');

export function num(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(/\s/g, '');
  if (s === '' || s[0] === '#') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g, ''), 10);
  if (/^-?\d+[.,]\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
  return null;
}

const MON_MAP = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MEI: 4, MAY: 4, JUN: 5, JUL: 6, AUG: 7, AGU: 7, AGS: 7, SEP: 8, OKT: 9, OCT: 9, NOV: 10, DES: 11, DEC: 11 };
export function monthIdx(s) {
  const t = String(s || '').trim().toUpperCase();
  if (!/^[A-Z]{3,5}$/.test(t)) return -1;
  const k = t.slice(0, 3);
  return k in MON_MAP ? MON_MAP[k] : -1;
}
const isYear = (s) => /^20\d\d$/.test(String(s).trim());
const norm = (s) => String(s || '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
const months12 = (g, r, c0) => Array.from({ length: 12 }, (_, i) => num(cell(g, r, c0 + i)));

export function docKey(name) {
  const t = String(name || '').toLowerCase();
  if (t.includes('syahnural')) return 'S';
  if (t.includes('rina')) return 'R';
  if (t.includes('gde')) return 'G';
  if (t.includes('heryani')) return 'H';
  if (t.includes('eddy')) return 'E';
  if (t.includes('andy')) return 'A';
  return 'O';
}

/* ---------- blok "tahun + JAN..DES + baris dokter + TOTAL" ---------- */
export function readYearBlocks(g) {
  const blocks = [];
  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (!isYear(row[c])) continue;
      let mc = -1;
      for (let k = c + 1; k <= c + 3; k++) {
        if (monthIdx(cell(g, r, k)) === 0) { mc = k; break; }
      }
      if (mc < 0) continue;
      const block = { year: parseInt(row[c], 10), rows: [], total: null };
      for (let rr = r + 1; rr <= r + 14 && rr < g.length; rr++) {
        const label = cell(g, rr, c);
        if (isYear(label) && monthIdx(cell(g, rr, mc)) === 0) break;
        if (!label) continue;
        if (label.toUpperCase() === 'TOTAL') { block.total = months12(g, rr, mc); break; }
        if (isYear(label)) break;
        block.rows.push({ name: label, months: months12(g, rr, mc) });
      }
      blocks.push(block);
    }
  }
  return blocks;
}

/* ---------- pivot "Row Labels 20xx | Count of NAMA" ---------- */
export function readPivots(g) {
  const out = [];
  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const m = /^Row Labels\s+(20\d\d)$/i.exec(String(row[c] || '').trim());
      if (!m) continue;
      const items = [];
      let grand = null;
      for (let rr = r + 1; rr < g.length && rr < r + 80; rr++) {
        const label = cell(g, rr, c);
        if (/^grand total$/i.test(label)) { grand = num(cell(g, rr, c + 1)); break; }
        if (!label) {
          // jeda pendek diizinkan, jeda panjang berarti pivot selesai
          if (!cell(g, rr + 1, c) && !cell(g, rr + 2, c)) break;
          continue;
        }
        if (/^row labels/i.test(label)) break;
        items.push({ label, v: num(cell(g, rr, c + 1)) });
      }
      out.push({ year: parseInt(m[1], 10), items, grand });
    }
  }
  return out;
}

const ageClass = (label) => {
  const t = norm(label).replace(/\s/g, '');
  if (/^<35/.test(t)) return 0;
  if (/^35/.test(t)) return 1;
  if (/^38/.test(t)) return 2;
  if (/^(41|42|43|44|>|≥)/.test(t)) return 3;
  return -1;
};

/* ---------- tab ALL ---------- */
const SECTIONS = [
  ['ivfAll', /fresh\s*&\s*frozen|\(ALL\)/i],
  ['fet', /frozen embryo|\(FET\)/i],
  ['et', /fresh embryo|\(ET\)/i],
  ['opu', /ovum pick|\(OPU\)/i],
  ['nfp', /new female|\(NFP\)/i],
  ['visits', /visite/i],
  ['iui', /intrauterine|\bIUI\b/i],
];

export function parseAll(g, ctx) {
  const starts = [];
  for (let r = 0; r < g.length; r++) {
    const label = norm(cell(g, r, 0));
    if (!label || isYear(label) || /^target/i.test(label) || /^year$/i.test(label)) continue;
    const hit = SECTIONS.find(([, re]) => re.test(label));
    if (hit && label.length < 60) starts.push({ key: hit[0], r });
  }
  const res = {};
  const targets = {};
  starts.forEach((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].r : g.length;
    // kolom bulan dari baris header
    let mc = 1;
    for (let r = s.r + 1; r < Math.min(end, s.r + 4); r++) {
      for (let c = 0; c < 6; c++) if (monthIdx(cell(g, r, c)) === 0) { mc = c; break; }
    }
    const years = {};
    const tg = {};
    for (let r = s.r + 1; r < end; r++) {
      const label = norm(cell(g, r, 0));
      const mt = /^target\s+(20\d\d)$/i.exec(label);
      if (mt) { tg[mt[1]] = months12(g, r, mc); continue; }
      if (!isYear(label)) continue;
      const y = parseInt(label, 10);
      let arr = months12(g, r, mc);
      if (y === ctx.year) arr = arr.map((v, i) => (i >= ctx.month ? null : v));
      years[y] = arr;
    }
    res[s.key] = years;
    if (Object.keys(tg).length) targets[s.key] = tg;
  });
  return { ...res, targets };
}

/* ---------- tab Take Home Baby ---------- */
export function parseThb(g) {
  let hr = -1;
  let cols = [];
  for (let r = 0; r < Math.min(g.length, 12); r++) {
    const c = [];
    (g[r] || []).forEach((v, i) => { if (/^total tindakan$/i.test(String(v).trim())) c.push(i); });
    if (c.length >= 3) { hr = r; cols = c; break; }
  }
  if (hr < 0) throw new Error('Header Take Home Baby tidak ditemukan');
  const out = { fet: {}, et: {}, iui: {} };
  const keys = ['fet', 'et', 'iui'];
  for (let r = hr + 1; r < g.length; r++) {
    let y = null;
    for (let c = 0; c < Math.min(cols[0], 3); c++) if (isYear(cell(g, r, c))) { y = parseInt(cell(g, r, c), 10); break; }
    if (y == null) { if (r > hr + 3 && Object.keys(out.fet).length) break; else continue; }
    keys.forEach((k, i) => {
      out[k][y] = { n: num(cell(g, r, cols[i])), preg: num(cell(g, r, cols[i] + 1)), born: num(cell(g, r, cols[i] + 2)) };
    });
  }
  return out;
}

/* ---------- tab Sumber Pasien ---------- */
export function parseSumber(g) {
  const out = {};
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < (g[r] || []).length; c++) {
      const m = /^Fresh\s+(20\d\d)$/i.exec(cell(g, r, c));
      if (!m) continue;
      let mc = -1;
      for (let k = c + 1; k <= c + 4; k++) if (monthIdx(cell(g, r, k)) === 0) { mc = k; break; }
      if (mc < 0) continue;
      const y = parseInt(m[1], 10);
      const rec = {};
      for (let rr = r + 1; rr <= r + 12 && rr < g.length; rr++) {
        const label = cell(g, rr, c).toLowerCase();
        if (/^fresh\s+20\d\d$/.test(label)) break;
        if (!label) continue;
        const arr = months12(g, rr, mc);
        if (label === 'opu') rec.opu = arr;
        else if (label === 'nfp') rec.nfp = arr;
        else if (label === 'ofp') rec.ofp = arr;
        else if (/failed/.test(label)) rec.fail = arr;
      }
      out[y] = rec;
    }
  }
  return out;
}

/* ---------- tab Produktivitas (embriolog) ---------- */
export function parseEmbriolog(g) {
  let r0 = -1;
  let lc = 0;
  for (let r = 0; r < g.length && r0 < 0; r++) {
    for (let c = 0; c < (g[r] || []).length; c++) {
      if (/^nama$/i.test(cell(g, r, c))) { r0 = r; lc = c; break; }
    }
  }
  if (r0 < 0) throw new Error('Blok embriolog tidak ditemukan');
  const labels = [];
  for (let c = lc + 1; c < g[r0].length; c++) {
    const t = cell(g, r0, c);
    if (!t) continue;
    if (/^total$/i.test(t)) break;
    labels.push(t);
  }
  const years = labels.map((t) => {
    const m = /(?:YTD|Per)\s+(\w+)\s+(20\d\d)/i.exec(t);
    return m ? `${m[2]} (s.d. ${m[1].slice(0, 3)})` : t;
  });
  const names = [];
  const sa = years.map(() => []);
  const dfi = years.map(() => []);
  for (let r = r0 + 2; r < g.length; r++) {
    const name = cell(g, r, lc);
    if (!name) { if (names.length) break; else continue; }
    if (/^total$/i.test(name)) break;
    names.push(name);
    years.forEach((_, yi) => {
      sa[yi].push(num(cell(g, r, lc + 1 + yi * 2)) || 0);
      dfi[yi].push(num(cell(g, r, lc + 2 + yi * 2)) || 0);
    });
  }
  if (!names.length) throw new Error('Embriolog kosong');
  return { names, years, sa, dfi };
}

/* ---------- tab 2026 (target cabang MIPT) ---------- */
export function parseMipt(g) {
  const hits = [];
  for (let r = 0; r < g.length; r++) {
    if (/^MIPT$/i.test(cell(g, r, 0))) hits.push(months12(g, r, 1));
  }
  if (hits.length < 1) throw new Error('Baris MIPT tidak ditemukan');
  return { fresh: hits[0], frozen: hits[1] || null };
}

/* ---------- Sheet11 (domisili) ---------- */
export function parseDomicile(g) {
  const byYear = {};
  readPivots(g).forEach((p) => {
    if (p.items.some((i) => ageClass(i.label) >= 0)) return; // pivot bersarang usia + domisili
    const map = {};
    p.items.forEach((i) => { if (i.v != null) map[i.label] = (map[i.label] || 0) + i.v; });
    if (Object.keys(map).length) byYear[p.year] = map;
  });
  const ys = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  if (!ys.length) throw new Error('Pivot domisili tidak ditemukan');
  const use = ys.slice(-2);
  const names = new Set();
  use.forEach((y) => Object.keys(byYear[y]).forEach((n) => names.add(n)));
  const rows = [...names].map((n) => [n, ...use.map((y) => byYear[y][n] || 0)]);
  rows.sort((a, b) => b[b.length - 1] - a[a.length - 1] || b[1] - a[1] || a[0].localeCompare(b[0]));
  return { years: use, rows };
}

/* ---------- tab OPU: per dokter & usia ---------- */
export function parseOpu(g) {
  const docs = {};
  readYearBlocks(g).forEach((b) => {
    if (!b.rows.length) return;
    const rec = { S: 0, R: 0, G: 0, H: 0, O: 0 };
    b.rows.forEach((row) => {
      const k = docKey(row.name);
      const key = k === 'E' || k === 'A' ? 'O' : k;
      rec[key] += row.months.reduce((a, v) => a + (v || 0), 0);
    });
    docs[b.year] = rec;
  });
  const age = {};
  readPivots(g).forEach((p) => {
    const a = [0, 0, 0, 0];
    let any = false;
    p.items.forEach((i) => {
      const k = ageClass(i.label);
      if (k >= 0 && i.v != null) { a[k] += i.v; any = true; }
    });
    if (any) age[p.year] = a;
  });
  if (!Object.keys(docs).length) throw new Error('Blok dokter OPU tidak ditemukan');
  return { docs, age };
}

/* ---------- tab dengan blok dokter per tahun: NFP & Konsul ---------- */
export function parseDoctorBlocks(g, ctx, { trimTrailingZeros } = {}) {
  const perDoc = {};
  const totals = {};
  readYearBlocks(g).forEach((b) => {
    if (!b.rows.length) return;
    const v = DOC_KEYS.map(() => 0);
    b.rows.forEach((row) => {
      const i = DOC_KEYS.indexOf(docKey(row.name));
      if (i >= 0) v[i] += row.months.reduce((a, x) => a + (x || 0), 0);
    });
    perDoc[b.year] = v;
    if (b.total) {
      let t = b.total.slice();
      if (trimTrailingZeros && b.year === ctx.year) {
        let e = t.length;
        while (e > 0 && !t[e - 1]) e--;
        t = t.map((x, i) => (i < e ? x : null));
      }
      totals[b.year] = t;
    }
  });
  if (!Object.keys(perDoc).length) throw new Error('Blok dokter tidak ditemukan');
  return { perDoc, totals };
}
