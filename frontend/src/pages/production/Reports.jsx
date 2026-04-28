import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function ProductionReports() {
  return (
    <div>
      <PageHeader title="Production Reports" subtitle="Yield, OEE and consumption analytics." />
      <div className="card">
        <EmptyState icon="📊" title="Reports coming soon" message="Production analytics will be available here." />
      </div>
    </div>
  );
}
