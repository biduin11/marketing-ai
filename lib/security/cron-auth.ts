export type CronAuthResult =
  | { authorized: true }
  | { authorized: false; status: 401 | 503; error: string }

export function authorizeCronRequest(
  authorizationHeader: string | null,
  cronSecret: string | undefined
): CronAuthResult {
  if (!cronSecret) {
    return {
      authorized: false,
      status: 503,
      error: "CRON_SECRET is not configured",
    }
  }

  if (authorizationHeader !== `Bearer ${cronSecret}`) {
    return { authorized: false, status: 401, error: "Unauthorized" }
  }

  return { authorized: true }
}
