# Dasbor Pasien MIPT

Dashboard statistik pasien dan tindakan MIPT (Next.js App Router) yang membaca langsung dari Google Sheet **TOTAL PASIEN TINDAKAN MIPT**, dengan login dan sidebar.

Menu: Ringkasan, Kunjungan, OPU dan target, Transfer dan kehamilan, Profil pasien, Dokter dan embriolog, Catatan data. Filter tahun, tooltip, tombol "Tabel" di tiap grafik, mode terang/gelap otomatis, responsif sampai layar HP.

## 1. Environment variable

Salin `.env.example` ke `.env.local` (lokal) atau isi di **Vercel > Project > Settings > Environment Variables**.

| Nama | Wajib | Keterangan |
|---|---|---|
| `DASHBOARD_USERNAME` | ya | username login |
| `DASHBOARD_PASSWORD` | ya | password login |
| `SESSION_SECRET` | ya | minimal 32 karakter acak, untuk menandatangani sesi. Buat dengan `openssl rand -base64 48` |
| `SESSION_HOURS` | tidak | umur maksimal sesi, default 8 jam |
| `SYNC_TTL_SECONDS` | tidak | lama cache hasil baca sheet, default 300 (5 menit) |
| `SHEET_ID` | tidak | ID spreadsheet, default sheet MIPT |

Kalau salah satu dari tiga yang wajib belum diisi, tidak ada yang bisa login (tidak ada password bawaan).
Mengganti `DASHBOARD_PASSWORD` atau `SESSION_SECRET` otomatis mengeluarkan semua sesi yang sedang aktif.

## 2. Sinkronisasi Google Sheet

Server membaca tiap tab lewat ekspor CSV (`/export?format=csv&gid=...`), jadi spreadsheet harus dibagikan sebagai **"Siapa saja yang memiliki link" > Pelihat**. Kalau sheet-nya privat, sinkronisasi gagal dan dasbor menampilkan data cadangan.

Tab yang dibaca: ALL, NFP, KONSUL DOKTER, OPU, Take Home Baby, Sumber Pasien, Produktivitas Dokter & Embriolog, 2026, Sheet11. Parser mencari blok berdasarkan label (judul seksi, tahun + JAN..DES, "Row Labels 20xx"), bukan nomor baris, jadi tahan terhadap baris yang bergeser. Kalau layout satu blok berubah drastis, bagian itu memakai data cadangan (`lib/fallback.js`) dan muncul peringatan di sidebar dan di menu Catatan data.

- Hasil baca disimpan di memori server selama 5 menit. Tombol **Segarkan** di sidebar memaksa baca ulang (dibatasi 1 kali per 20 detik).
- Tab OPU dan NFP berisi nama dan RM pasien. Server hanya membaca blok rekap (per dokter, pivot usia). **Kolom nama dan RM tidak dibaca dan tidak pernah dikirim ke browser.**
- Bulan tahun berjalan dihitung dari tanggal server (zona Asia/Pontianak): bulan setelah bulan ini dianggap belum terjadi, bukan nol.
- Perbandingan tahun berjalan selalu dengan periode yang sama tahun lalu (mis. Jan sampai Okt vs Jan sampai Okt).

## 3. Keamanan login

- Sesi disimpan di cookie `httpOnly`, `SameSite=Lax`, `Secure` di produksi, **tanpa tanggal kedaluwarsa** (hilang saat browser ditutup) dan ditandatangani HMAC-SHA256, plus batas umur di dalam token (`SESSION_HOURS`).
- Semua halaman dilindungi dua lapis: `proxy.js` dan pemeriksaan sesi di tiap halaman dan tiap akses data.
- Perbandingan username/password waktu-konstan, jeda 0,7 detik saat gagal, dan blokir sementara setelah 6 kali gagal per IP (best effort, memori per instance serverless).
- Header keamanan (`X-Frame-Options`, `nosniff`, `noindex`) dan `Cache-Control: private, no-store` untuk halaman yang sudah login.

## 4. Jalankan

```bash
npm install
cp .env.example .env.local   # lalu isi
npm run dev                  # http://localhost:3000
npm run build && npm start
```

Pengembangan offline: simpan CSV tiap tab sebagai `<gid>.csv` di satu folder, lalu set `SHEET_LOCAL_DIR=/path/folder` (hanya aktif di mode development).

## Struktur

```
proxy.js                 gerbang login (Next 16)
app/login/               halaman dan server action login/logout/segarkan
app/(app)/               Ringkasan dan halaman menu ([section])
components/              AppShell (sidebar+topbar), ChartCard, Summary, Tables
lib/sheet.js             parser CSV dan blok-blok sheet
lib/sync.js              unduh, gabung, cache, cadangan
lib/notes.js             catatan kualitas data yang dihitung otomatis
lib/specs.js             definisi grafik
lib/charts.js            mesin grafik SVG + tooltip
lib/token.js, session.js sesi
lib/fallback.js          data cadangan (per 26 Okt 2026)
```
