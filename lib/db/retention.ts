/** Rolling retention window, measured from the article's publication time. */
export const NEWS_RETENTION_DAYS = 90;

export function newsRetentionCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
