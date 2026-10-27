export const MENU = [
  { id: 'ringkasan', href: '/', label: 'Ringkasan', icon: 'home', group: 'MENU UTAMA',
    title: 'Ringkasan', sub: 'Angka tahun berjalan dibandingkan dengan periode yang sama tahun lalu.' },
  { id: 'kunjungan', href: '/kunjungan', label: 'Kunjungan', icon: 'users', group: 'MENU UTAMA',
    title: 'Kunjungan dan pasien baru', sub: 'Garis membandingkan tahun terpilih dengan tahun sebelumnya. Pita biru pada grafik tahunan menandai tahun terpilih.' },
  { id: 'opu', href: '/opu', label: 'OPU dan target', icon: 'target', group: 'MENU UTAMA',
    title: 'Pengambilan sel telur (OPU) dan target', sub: 'Target bulanan diambil dari tab ALL.' },
  { id: 'hasil', href: '/hasil', label: 'Transfer dan kehamilan', icon: 'heart', group: 'MENU UTAMA',
    title: 'Transfer embrio, IUI, dan kehamilan', sub: 'ET segar sudah jarang dilakukan sejak 2023, jadi tingkat kehamilannya hanya digambar untuk FET dan IUI. Hasil tahun berjalan belum final.' },
  { id: 'pasien', href: '/pasien', label: 'Profil pasien', icon: 'pie', group: 'MENU UTAMA',
    title: 'Profil pasien', sub: 'Sumber pasien OPU, asal daerah, dan kelompok usia. Hanya angka agregat.' },
  { id: 'dokter', href: '/dokter', label: 'Dokter dan embriolog', icon: 'stetho', group: 'MENU UTAMA',
    title: 'Dokter dan embriolog', sub: 'Warna dokter sama di semua grafik.' },
  { id: 'catatan', href: '/catatan', label: 'Catatan data', icon: 'note', group: 'LAINNYA',
    title: 'Catatan data', sub: 'Hal di spreadsheet yang perlu dicek sebelum angkanya dipakai untuk laporan. Dibuat otomatis dari data yang sedang dibaca.' },
];

export const PAGE_IDS = MENU.filter((m) => m.id !== 'ringkasan').map((m) => m.id);
