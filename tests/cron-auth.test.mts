import assert from "node:assert/strict"
import test from "node:test"

import { authorizeCronRequest } from "../lib/security/cron-auth.ts"

test("cron access fails closed when CRON_SECRET is missing", () => {
  assert.deepEqual(authorizeCronRequest(null, undefined), {
    authorized: false,
    status: 503,
    error: "CRON_SECRET is not configured",
  })
})

test("cron access rejects an invalid bearer token", () => {
  assert.deepEqual(authorizeCronRequest("Bearer wrong", "correct"), {
    authorized: false,
    status: 401,
    error: "Unauthorized",
  })
})

test("cron access accepts the configured bearer token", () => {
  assert.deepEqual(authorizeCronRequest("Bearer correct", "correct"), {
    authorized: true,
  })
})
