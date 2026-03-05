import { Card } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: '--' },
          { label: 'Pending Tickets', value: '--' },
          { label: 'SLA At Risk', value: '--' },
          { label: 'Avg First Response', value: '--' },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      <Card padding="none">
        <EmptyState
          title="No tickets assigned to you yet"
          description="Unassigned tickets will appear here once your admin configures assignment rules."
        />
      </Card>
    </div>
  );
}
