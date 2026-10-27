'use client';

import { CHARTS } from '../lib/specs';
import ChartCard from './ChartCard';
import { OutcomeTable, EmbryologistTable } from './Tables';

export default function SectionView({ sec, ids, D, year }) {
  const defs = ids ? ids.map((id) => CHARTS.find((c) => c.id === id)).filter(Boolean) : CHARTS.filter((c) => c.sec === sec);
  return (
    <div className="grid">
      {defs.map((def) => <ChartCard key={def.id} def={def} D={D} year={year} />)}
      {sec === 'hasil' && <OutcomeTable D={D} />}
      {sec === 'dokter' && <EmbryologistTable D={D} />}
    </div>
  );
}
