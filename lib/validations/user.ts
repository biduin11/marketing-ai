import { z } from "zod"

export const userRoleValues = ["MARKETER", "BUSINESS_OWNER"] as const

export const setUserRoleSchema = z.object({
  role: z.enum(userRoleValues),
})

export type UserRole = (typeof userRoleValues)[number]
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>
