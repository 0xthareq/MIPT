import { MON, lastFilled } from './util';
import { has, sum } from './charts';

/** Catatan kualitas data, dihitung dari data yang sedang tampil (bukan teks tetap). */
export function buildNotes(D) {
  const cy = D.meta.year;
  const cm = D.meta.month;
  const notes = [];

  if (!has(D.visits[cy])) {
    const k = lastFilled(D.konsulTotal[cy]);
    notes.push([
      `Kunjungan ${cy} belum ada.`,
      `Baris ${cy} di blok Visite Patient kosong, sehingga kolom % di sheet menampilkan -100%.` +
        (k ? ` Konsul Dokter baru terisi sampai ${MON[k - 1]}.` : ''),
    ]);
  }

  notes.push([
    'Kolom % tahun berjalan di sheet menyesatkan.',
    `Tahun ${cy} dibandingkan dengan setahun penuh tahun lalu. Dasbor ini membandingkan periode yang sama, misalnya Jan–${MON[cm - 1]} dengan Jan–${MON[cm - 1]}.`,
  ]);

  [['iui', 'IUI'], ['fet', 'FET'], ['opu', 'OPU']].forEach(([key, label]) => {
    const a = D[key][cy];
    if (!a) return;
    let e = cm - 1;
    let s = e;
    while (s >= 0 && a[s] === 0) s--;
    s++;
    if (e - s + 1 >= 2) {
      notes.push([
        `${label} tercatat 0 dari ${MON[s]} sampai ${MON[e]} ${cy}.`,
        'Nilai 0 bisa berarti memang tidak ada tindakan atau belum diinput. Mohon dicek.',
      ]);
    }
  });

  notes.push([
    '"IVF Fresh & Frozen (ALL)" adalah OPU + FET.',
    'Angka di blok itu sama dengan OPU ditambah FET tiap bulan, bukan ET ditambah FET.',
  ]);

  const so = D.srcOpu && D.srcOpu[cy];
  if (so) {
    const diffs = [];
    for (let i = 0; i < cm; i++) {
      const a = D.opu[cy] && D.opu[cy][i];
      const b = so[i];
      if (a != null && b != null && a !== b) diffs.push(`${MON[i]} ${b} vs ${a}`);
    }
    if (diffs.length) {
      notes.push([
        `Angka OPU ${cy} berbeda antar tab.`,
        `Tab Sumber Pasien dibanding tab ALL (Sumber vs ALL): ${diffs.slice(0, 8).join(', ')}${diffs.length > 8 ? ', dst.' : ''}. Dasbor memakai tab ALL.`,
      ]);
    }
  }

  if (D.mipt && D.opuTarget[cy]) {
    const a = sum(D.opuTarget[cy]);
    const b = sum(D.mipt.fresh);
    if (a !== b) {
      notes.push([
        `Target OPU ${cy} ada dua versi.`,
        `Tab ALL: ${a} siklus. Tab target cabang (baris MIPT): ${b}. Dasbor memakai ${a}.`,
      ]);
    }
  }

  if (D.thb) {
    [['fet', 'FET'], ['iui', 'IUI']].forEach(([k, label]) => {
      const t = D.thb[k] && D.thb[k][cy];
      const i = D.years.indexOf(cy);
      const n = D.outc[k].n[i];
      if (t && t.n != null && n != null && t.n !== n) {
        notes.push([
          `Tindakan ${label} ${cy} berbeda di tab Take Home Baby.`,
          `Take Home Baby mencatat ${t.n}, tab ALL ${n}. Tingkat kehamilan memakai tindakan dari tab ALL dan jumlah hamil dari Take Home Baby.`,
        ]);
      }
    });
  }

  notes.push([
    `Hasil ${cy} belum final.`,
    'Kehamilan dan kelahiran dari transfer terbaru belum masuk, jadi tingkat kehamilan dan bayi lahir tahun berjalan akan naik saat hasilnya dicatat.',
  ]);

  const ay = Object.keys(D.age).map(Number).sort((a, b) => a - b);
  if (ay.length) {
    notes.push([
      'Usia dan domisili.',
      `Hanya tersedia untuk pasien OPU: usia ${ay[0]} sampai ${ay[ay.length - 1]}, domisili ${D.dom.years.join(' dan ')} (dari Sheet11).`,
    ]);
  }

  D.meta.warnings.forEach((w) => notes.push(['Sinkronisasi.', w]));
  return notes;
}
