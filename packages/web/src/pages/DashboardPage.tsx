import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card.js';
import { useTicketStats } from '../hooks/useTickets.js';
import { useReportsDashboard } from '../hooks/useReportsDashboard.js';
import { useAuthStore } from '../stores/auth.store.js';

function minutesToDisplay(minutes: number): string {
  if (!minutes || minutes === 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  onClick?: () => void;
}

function StatCard({ label, value, sub, color, onClick }: StatCardProps) {
  return (
    <Card
      padding="md"
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={onClick}
    >
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? 'text-text-primary'}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [rangeDays, setRangeDays] = useState(30);
  const { from, to } = getDateRange(rangeDays);
  const { data: metrics, isLoading } = useReportsDashboard(from, to);
  const stats = useTicketStats();

  const openCount = stats?.open ?? 0;
  const pendingCount = stats?.pending ?? 0;
  const resolvedCount = stats?.resolved_today ?? 0;

  const slaAtRisk = isLoading ? '—' : pct(1 - (metrics?.sla_compliance.first_response_rate ?? 1));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Welcome back, {user?.full_name ?? 'Agent'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Period:</span>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                rangeDays === d
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Live ticket stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Open Tickets"
          value={openCount}
          color="text-primary"
          onClick={() => navigate('/tickets?status=open')}
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          color="text-warning"
          onClick={() => navigate('/tickets?status=pending')}
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          color="text-success"
          onClick={() => navigate('/tickets?status=resolved')}
        />
        <StatCard
          label="SLA Miss Rate"
          value={slaAtRisk}
          color={
            metrics && metrics.sla_compliance.first_response_rate < 0.8
              ? 'text-danger'
              : 'text-text-primary'
          }
          sub={`${rangeDays}-day period`}
        />
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card padding="md">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Response Times
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Avg First Response</span>
              <span className="text-sm font-semibold text-text-primary">
                {isLoading ? '…' : minutesToDisplay(metrics?.avg_first_response_minutes ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Avg Resolution</span>
              <span className="text-sm font-semibold text-text-primary">
                {isLoading ? '…' : minutesToDisplay(metrics?.avg_resolution_minutes ?? 0)}
              </span>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            SLA Compliance
          </p>
          <div className="space-y-3">
            {[
              { label: 'First Response', rate: metrics?.sla_compliance.first_response_rate ?? 0 },
              { label: 'Resolution', rate: metrics?.sla_compliance.resolution_rate ?? 0 },
            ].map(({ label, rate }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className={`font-semibold ${rate >= 0.8 ? 'text-success' : 'text-danger'}`}>
                    {isLoading ? '…' : pct(rate)}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rate >= 0.8 ? 'bg-success' : 'bg-danger'}`}
                    style={{ width: isLoading ? '0%' : `${Math.round(rate * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            CSAT
          </p>
          {isLoading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : metrics?.csat.response_count === 0 ? (
            <p className="text-sm text-text-secondary">No CSAT responses yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Avg Score</span>
                <span className="text-2xl font-bold text-text-primary">
                  {metrics?.csat.average_score.toFixed(1)} <span className="text-sm font-normal text-text-secondary">/ 5</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Responses</span>
                <span className="text-sm font-semibold text-text-primary">
                  {metrics?.csat.response_count}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Response Rate</span>
                <span className="text-sm font-semibold text-text-primary">
                  {pct(metrics?.csat.response_rate ?? 0)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Ticket volume by day */}
      {metrics && metrics.ticket_volume.by_day.length > 0 && (
        <Card padding="md" className="mb-6">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Ticket Volume — Last {rangeDays} Days ({metrics.ticket_volume.total} total)
          </p>
          <div className="flex items-end gap-1 h-24">
            {metrics.ticket_volume.by_day.map((d) => {
              const max = Math.max(...metrics.ticket_volume.by_day.map((x) => x.count), 1);
              const heightPct = (d.count / max) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full bg-primary/70 hover:bg-primary rounded-t transition-colors"
                    style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-text-primary text-surface text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                    {d.date}: {d.count}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Open tickets by agent (admin only) */}
      {isAdmin && (
        <Card padding="md">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Open Tickets by Agent
          </p>
          {isLoading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : !metrics?.open_tickets_by_agent.length ? (
            <p className="text-sm text-text-secondary">No open tickets assigned to agents.</p>
          ) : (
            <div className="space-y-3">
              {metrics.open_tickets_by_agent
                .sort((a, b) => b.count - a.count)
                .map((agent) => {
                  const max = Math.max(...metrics.open_tickets_by_agent.map((a) => a.count), 1);
                  return (
                    <div key={agent.agent_id} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-text-secondary truncate shrink-0">
                        {agent.agent_name}
                      </div>
                      <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(agent.count / max) * 100}%` }}
                        />
                      </div>
                      <div className="w-6 text-sm font-semibold text-text-primary text-right shrink-0">
                        {agent.count}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
