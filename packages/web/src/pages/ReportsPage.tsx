import { Card } from '../components/ui/Card.js';
import { Spinner } from '../components/ui/Spinner.js';
import { useReportsDashboard } from '../hooks/useReportsDashboard.js';
import type { DashboardMetrics } from '../hooks/useReportsDashboard.js';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  open: '#2563EB',
  pending: '#F59E0B',
  resolved: '#16A34A',
  closed: '#6B7280',
};

function StatCard({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <Card padding="md">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-text-primary mt-1">
        {value}{suffix ? <span className="text-sm font-normal text-text-secondary ml-1">{suffix}</span> : null}
      </p>
    </Card>
  );
}

function TicketVolumeChart({ data }: { data: DashboardMetrics['ticket_volume']['by_day'] }) {
  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Ticket Volume (Last 30 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(val: string) => val.slice(5)}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              labelFormatter={(label) => `Date: ${String(label)}`}
              formatter={(value) => [String(value ?? 0), 'Tickets']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TicketsByAgentChart({ data }: { data: DashboardMetrics['open_tickets_by_agent'] }) {
  const chartData = data.slice(0, 10);

  if (chartData.length === 0) {
    return (
      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Open Tickets by Agent</h3>
        <p className="text-sm text-text-secondary text-center py-8">No open tickets assigned to agents.</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Open Tickets by Agent (Top 10)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="agent_name"
              tick={{ fontSize: 11 }}
              width={120}
            />
            <Tooltip formatter={(value) => [String(value ?? 0), 'Tickets']} />
            <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TicketsByStatusChart({ data }: { data: DashboardMetrics }) {
  // Derive status counts from open_tickets_by_agent for open count
  // and use ticket_volume for overall; we use a simplified approach here
  const statusData = [
    { name: 'Open', value: data.open_tickets_by_agent.reduce((sum, a) => sum + a.count, 0) || 0, color: STATUS_COLORS.open },
    { name: 'Pending', value: 0, color: STATUS_COLORS.pending },
    { name: 'Resolved', value: 0, color: STATUS_COLORS.resolved },
    { name: 'Closed', value: 0, color: STATUS_COLORS.closed },
  ].filter((d) => d.value > 0);

  // If we have no data at all, show a message
  if (statusData.length === 0) {
    return (
      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Tickets by Status</h3>
        <p className="text-sm text-text-secondary text-center py-8">No ticket status data available.</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Tickets by Status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AgentPerformanceTable({ data }: { data: DashboardMetrics['open_tickets_by_agent'] }) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Agent Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="px-4 py-2 text-left font-medium text-text-secondary">Agent</th>
              <th className="px-4 py-2 text-right font-medium text-text-secondary">Open Tickets</th>
            </tr>
          </thead>
          <tbody>
            {data.map((agent) => (
              <tr key={agent.agent_id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-text-primary">{agent.agent_name}</td>
                <td className="px-4 py-2 text-right text-text-primary font-medium">{agent.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ReportsPage() {
  const { data, isLoading, error } = useReportsDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading reports" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">Reports</h1>
        <Card padding="lg">
          <p className="text-sm text-danger text-center">
            Failed to load dashboard metrics. Please try again later.
          </p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Reports Dashboard</h1>

      {/* Period info */}
      <p className="text-sm text-text-secondary mb-4">
        Showing data from {data.period.from} to {data.period.to}
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Tickets" value={data.ticket_volume.total} />
        <StatCard
          label="Avg First Response"
          value={data.avg_first_response_minutes}
          suffix="min"
        />
        <StatCard
          label="Avg Resolution"
          value={data.avg_resolution_minutes}
          suffix="min"
        />
        <StatCard
          label="SLA Compliance"
          value={`${Math.round(data.sla_compliance.first_response_rate * 100)}%`}
        />
        <StatCard
          label="CSAT Score"
          value={data.csat.average_score > 0 ? data.csat.average_score.toFixed(1) : '--'}
          suffix={data.csat.response_count > 0 ? `(${data.csat.response_count} responses)` : undefined}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TicketVolumeChart data={data.ticket_volume.by_day} />
        <TicketsByAgentChart data={data.open_tickets_by_agent} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TicketsByStatusChart data={data} />
        <Card padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">SLA Compliance</h3>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">First Response</span>
                <span className="font-medium text-text-primary">
                  {Math.round(data.sla_compliance.first_response_rate * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round(data.sla_compliance.first_response_rate * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">Resolution</span>
                <span className="font-medium text-text-primary">
                  {Math.round(data.sla_compliance.resolution_rate * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${Math.round(data.sla_compliance.resolution_rate * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent performance table */}
      <AgentPerformanceTable data={data.open_tickets_by_agent} />
    </div>
  );
}
