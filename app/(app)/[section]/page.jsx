import { notFound } from 'next/navigation';
import PageFrame, { parseYear } from '../../../components/PageFrame';
import SectionView from '../../../components/SectionView';
import { loadDashboardData } from '../../../lib/session';
import { PAGE_IDS } from '../../../lib/menu';
import { buildNotes } from '../../../lib/notes';

export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }) {
  const { section } = await params;
  if (!PAGE_IDS.includes(section)) notFound();
  const { session, data: D } = await loadDashboardData();
  const sp = await searchParams;
  const year = parseYear(sp?.tahun, D);

  if (section === 'catatan') {
    const notes = buildNotes(D);
    return (
      <PageFrame D={D} session={session} year={year} active="catatan">
        <ul className="notes">
          {notes.map((n, i) => (
            <li key={i}><b>{n[0]} </b>{n[1]}</li>
          ))}
        </ul>
        <p className="foot">
          Dasbor ini hanya memuat angka agregat. Nama dan nomor RM pasien tidak pernah dikirim ke browser.
        </p>
      </PageFrame>
    );
  }
  return (
    <PageFrame D={D} session={session} year={year} active={section}>
      <SectionView sec={section} D={D} year={year} />
    </PageFrame>
  );
}
