import { FALLBACK } from './fallback';
import * as S from './sheet';

const SHEET_ID = process.env.SHEET_ID || '1iQio1PVSvPHGsul0eaOPLeldGq0cwoDky-3FBtDZjdA';
const GID = {
  all: 814808009,
  nfp: 1607038256,
  konsul: 1432507242,
  opu: 614703147,
  thb: 976880671,
  sumber: 370772118,
  prod: 1049193834,
  mipt: 729672746,
  sheet11: 378226875,
};
const TTL_MS = (parseInt(process.env.SYNC_TTL_SECONDS || '', 10) || 300) * 1000;
const TZ = 'Asia/Pontianak';

function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: 'numeric' }).formatToParts(new Date());
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  return { year: get('year'), month: get('month') };
}

function stamp() {
  const d = new Date();
  const label = new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d).replace(/\./g, '.');
  return { syncedAt: d.toISOString(), syncedLabel: label + ' WIB' };
}

async function fetchCsv(gid) {
  if (process.env.SHEET_LOCAL_DIR && process.env.NODE_ENV !== 'production') {
    // hanya untuk pengembangan offline: baca <dir>/<gid>.csv
    const { readFile } = await import('node:fs/promises');
    return S.parseCsv(await readFile(`${process.env.SHEET_LOCAL_DIR}/${gid}.csv`, 'utf8'));
  }
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'Mozilla/5.0 (mipt-dashboard)' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  if (/text\/html/i.test(res.headers.get('content-type') || '') || /^\s*<(!doctype|html)/i.test(text)) {
    throw new Error('sheet belum dibagikan sebagai "Siapa saja yang memiliki link" (diminta login)');
  }
  return S.parseCsv(text);
}

const align = (years, fn) => years.map((y) => fn(y));

async function build() {
  const ctx = today();
  const entries = await Promise.all(
    Object.entries(GID).map(async ([k, gid]) => {
      try { return [k, { grid: await fetchCsv(gid) }]; } catch (e) { return [k, { error: String(e.message || e) }]; }
    }),
  );
  const tabs = Object.fromEntries(entries);
  if (tabs.all.error) throw new Error('tab ALL gagal dibaca: ' + tabs.all.error);

  const warnings = [];
  const fallbacks = [];
  const use = (label, fn, fb) => {
    try {
      const t = fn();
      return t;
    } catch (e) {
      fallbacks.push(label);
      warnings.push(`${label}: memakai data cadangan (${String(e.message || e)}).`);
      return fb;
    }
  };
  const need = (key) => { if (tabs[key].error) throw new Error('tab gagal diunduh, ' + tabs[key].error); return tabs[key].grid; };

  const all = S.parseAll(tabs.all.grid, ctx);
  for (const k of ['visits', 'nfp', 'opu', 'et', 'fet', 'iui']) {
    if (!all[k] || !Object.keys(all[k]).length) throw new Error(`blok ${k} tidak ditemukan di tab ALL`);
  }
  const minY = Math.min(...Object.keys(all.visits).map(Number));
  const maxY = Math.max(ctx.year, ...Object.keys(all.visits).map(Number));
  const years = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i);

  const thb = use('Hasil kehamilan (Take Home Baby)', () => S.parseThb(need('thb')), null);
  const outc = {};
  ['fet', 'et', 'iui'].forEach((k) => {
    outc[k] = {
      n: align(years, (y) => (all[k][y] && all[k][y].some((v) => v != null) ? all[k][y].reduce((a, v) => a + (v || 0), 0) : null)),
      preg: align(years, (y) => (thb && thb[k][y] ? thb[k][y].preg : null)),
      born: align(years, (y) => (thb && thb[k][y] ? thb[k][y].born : null)),
    };
  });
  const outcFinal = thb ? outc : FALLBACK.outc;

  const opuTab = use('Dokter dan usia OPU', () => S.parseOpu(need('opu')), null);
  const opuDoc = opuTab
    ? Object.fromEntries(['S', 'R', 'G', 'H', 'O'].map((k) => [k, align(years, (y) => (opuTab.docs[y] ? opuTab.docs[y][k] : null))]))
    : FALLBACK.opuDoc;
  const age = opuTab && Object.keys(opuTab.age).length ? opuTab.age : FALLBACK.age;

  const konsul = use('Konsultasi dokter', () => S.parseDoctorBlocks(need('konsul'), ctx, { trimTrailingZeros: true }), null);
  const nfpTab = use('Pasien baru per dokter', () => S.parseDoctorBlocks(need('nfp'), ctx), null);
  const sumber = use('Sumber pasien', () => {
    const r = S.parseSumber(need('sumber'));
    if (!Object.keys(r).length) throw new Error('blok Fresh tidak ditemukan');
    return r;
  }, null);
  let src = FALLBACK.src;
  let srcOpu = {};
  if (sumber) {
    src = [];
    Object.keys(sumber).map(Number).sort((a, b) => a - b).forEach((y) => {
      const r = sumber[y];
      for (let m = 0; m < 12; m++) {
        const row = { y, m, nfp: r.nfp ? r.nfp[m] : null, ofp: r.ofp ? r.ofp[m] : null, fail: r.fail ? r.fail[m] : null };
        if (row.nfp != null || row.ofp != null || row.fail != null) src.push(row);
      }
      if (r.opu) srcOpu[y] = r.opu;
    });
  }
  const dom = use('Domisili pasien', () => S.parseDomicile(need('sheet11')), FALLBACK.dom);
  const emb = use('Embriolog', () => S.parseEmbriolog(need('prod')), FALLBACK.emb);
  const mipt = use('Target cabang', () => S.parseMipt(need('mipt')), null);

  return {
    meta: { ...ctx, ...stamp(), source: fallbacks.length ? 'sebagian' : 'sheet', fallbacks, warnings },
    years,
    visits: all.visits, nfp: all.nfp, opu: all.opu, et: all.et, fet: all.fet, iui: all.iui,
    opuTarget: (all.targets.opu) || {},
    fetTarget: (all.targets.fet) || {},
    konsulTotal: konsul ? konsul.totals : FALLBACK.konsulTotal,
    konsulDoc: konsul ? konsul.perDoc : FALLBACK.konsulDoc,
    nfpDoc: nfpTab ? nfpTab.perDoc : FALLBACK.nfpDoc,
    outc: outcFinal, thb,
    opuDoc, age, src, srcOpu, dom, emb, mipt,
  };
}

function fallbackData(reason) {
  const ctx = today();
  return {
    meta: { ...ctx, ...stamp(), source: 'cadangan', fallbacks: ['semua'], warnings: [`Sinkronisasi gagal (${reason}). Menampilkan data cadangan per 26 Okt 2026.`] },
    ...FALLBACK,
    srcOpu: {}, thb: null, mipt: null, fetTarget: {},
  };
}

let cache = { at: 0, data: null };
let inflight = null;

export async function getData({ force = false } = {}) {
  if (cache.data && Date.now() - cache.at < (force ? 20000 : TTL_MS)) return cache.data; // paksa-segarkan dibatasi 20 detik
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const d = await build();
      cache = { at: Date.now(), data: d };
      return d;
    } catch (e) {
      const reason = String(e.message || e);
      if (cache.data) {
        const prev = cache.data;
        return { ...prev, meta: { ...prev.meta, warnings: [...prev.meta.warnings.filter((w) => !w.startsWith('Sinkronisasi gagal')), `Sinkronisasi gagal (${reason}). Menampilkan data terakhir yang berhasil dibaca (${prev.meta.syncedLabel}).`] } };
      }
      const fb = fallbackData(reason);
      cache = { at: Date.now() - TTL_MS + 30000, data: fb }; // coba lagi dalam 30 detik
      return fb;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
