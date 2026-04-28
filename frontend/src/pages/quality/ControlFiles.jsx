import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function ControlFiles() {
  return (
    <div>
      <PageHeader title="Control Files" subtitle="QC procedures and parameter sheets per product." />
      <div className="card">
        <EmptyState icon="📁" title="Control files registry" message="Manage QC parameters per product family here." />
      </div>
    </div>
  );
}
