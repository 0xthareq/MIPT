import './globals.css';

export const metadata = {
  title: { default: 'Dasbor Pasien MIPT', template: '%s' },
  description: 'Rekap pasien dan tindakan program kehamilan MIPT.',
  robots: { index: false, follow: false },
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
