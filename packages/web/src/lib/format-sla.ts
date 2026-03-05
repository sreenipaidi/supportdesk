import { differenceInMinutes, parseISO } from 'date-fns';

export type SLAStatus = 'on-track' | 'warning' | 'breached';

/**
 * Returns the SLA status based on due date.
 * - breached: past due
 * - warning: less than 30 minutes remaining
 * - on-track: more than 30 minutes remaining
 */
export function getSLAStatus(dueDate: string): SLAStatus {
  const due = parseISO(dueDate);
  const now = new Date();
  const minutesRemaining = differenceInMinutes(due, now);

  if (minutesRemaining < 0) return 'breached';
  if (minutesRemaining < 30) return 'warning';
  return 'on-track';
}

/**
 * Formats the SLA time remaining as a human-readable string.
 */
export function formatSLATimeRemaining(dueDate: string): string {
  const due = parseISO(dueDate);
  const now = new Date();
  const totalMinutes = differenceInMinutes(due, now);

  if (totalMinutes < 0) {
    const elapsed = Math.abs(totalMinutes);
    if (elapsed < 60) return `Breached ${elapsed}m ago`;
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    return `Breached ${hours}h ${mins}m ago`;
  }

  if (totalMinutes < 60) return `${totalMinutes}m left`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return `${hours}h ${mins}m left`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h left`;
}
