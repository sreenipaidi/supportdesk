import { getLogger } from '../lib/logger.js';
import { startEmailWorker } from './email.worker.js';

/**
 * Initialize and start all background workers.
 *
 * Workers process BullMQ queues for:
 * - email: Sends outbound email notifications
 * - sla-check: Periodic SLA compliance checks (every 5 minutes)
 * - auto-close: Periodic auto-close of resolved tickets (hourly)
 * - csat-survey: Delayed CSAT survey dispatch
 *
 * TODO: Add sla, auto-close, and csat workers when implemented.
 */
export function startWorkers(): { close: () => Promise<void> } {
  const logger = getLogger();
  logger.info('Starting background workers');

  const emailWorker = startEmailWorker();

  // TODO: Start SLA check worker
  // TODO: Start auto-close worker
  // TODO: Start CSAT survey worker

  return {
    close: async () => {
      logger.info('Stopping all background workers');
      await emailWorker.close();
    },
  };
}
