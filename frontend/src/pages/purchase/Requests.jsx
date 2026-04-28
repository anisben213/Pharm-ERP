import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function PurchaseRequests() {
  return (
    <div>
      <PageHeader title="Purchase Requests" subtitle="Internal requests pending conversion to orders." />
      <div className="card">
        <EmptyState icon="📝" title="No pending requests" message="Submitted requests from other departments will appear here." />
      </div>
    </div>
  );
}
