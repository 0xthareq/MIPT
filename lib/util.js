export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const N = null;
export const blank = () => Array(12).fill(null);
export const yearIdx = (D, y) => D.years.indexOf(y);
/** Jumlah bulan yang sudah terisi untuk tahun y (tahun berjalan: sampai bulan ini). */
export const asOf = (D, y) => (y === D.meta.year ? D.meta.month : 12);
export const perLabel = (y, m) => (m === 12 ? 'Jan–Des ' + y : 'Jan–' + MON[m - 1] + ' ' + y);
export const lastFilled = (arr) => {
  if (!arr) return 0;
  let k = 0;
  arr.forEach((v, i) => { if (v != null) k = i + 1; });
  return k;
};
