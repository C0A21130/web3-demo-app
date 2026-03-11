import type { BadgeIssueLog } from "./types.js";

const badgeIssueLogs: BadgeIssueLog[] = [];

export function addBadgeIssueLog(log: BadgeIssueLog): void {
  badgeIssueLogs.unshift(log);
  if (badgeIssueLogs.length > 100) {
    badgeIssueLogs.length = 100;
  }
}

export function getBadgeIssueLogs(limit = 20): BadgeIssueLog[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20;
  return badgeIssueLogs.slice(0, safeLimit);
}
