import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export stock reports." />
      <div className="card">
        <EmptyState
          icon="📋"
          title="Report builder coming soon"
          message="You will be able to generate stock movement, valuation and aging reports here."
          action={<button className="btn-outline">Request a report</button>}
        />
      </div>
    </div>
  );
}
