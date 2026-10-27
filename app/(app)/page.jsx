import PageFrame, { parseYear } from '../../components/PageFrame';
import Summary from '../../components/Summary';
import SectionView from '../../components/SectionView';
import { loadDashboardData } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const { session, data: D } = await loadDashboardData();
  const sp = await searchParams;
  const year = parseYear(sp?.tahun, D);
  return (
    <PageFrame D={D} session={session} year={year} active="ringkasan">
      <Summary D={D} year={year} />
      <h2 className="h2">Sorotan</h2>
      <SectionView ids={['opu-bulan', 'tindakan-tahun']} D={D} year={year} />
    </PageFrame>
  );
}
