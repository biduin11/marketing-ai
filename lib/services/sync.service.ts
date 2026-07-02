import type { Integration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { syncYandexMapsReviews } from "@/lib/services/integrations/yandex-maps.service"
import { syncTwoGisReviews } from "@/lib/services/integrations/twogis.service"
import { syncVkStats } from "@/lib/services/integrations/vk.service"
import { syncTelegramStats } from "@/lib/services/integrations/telegram.service"
import { syncAvitoStats } from "@/lib/services/integrations/avito.service"

export interface SyncResult {
  total: number
  succeeded: number
  failed: number
  errors: Array<{ platform: string; error: string }>
}

function runOne(integration: Integration): Promise<number> {
  switch (integration.platform) {
    case "YANDEX_MAPS":
      return syncYandexMapsReviews(integration)
    case "TWOGIS":
      return syncTwoGisReviews(integration)
    case "VK":
      return syncVkStats(integration)
    case "TELEGRAM":
      return syncTelegramStats(integration)
    case "AVITO":
      return syncAvitoStats(integration)
    default:
      return Promise.reject(new Error(`Неизвестная платформа: ${integration.platform}`))
  }
}

/**
 * Syncs every active integration of a project. One failing API never blocks
 * the others (Promise.allSettled). Updates lastSyncAt on every integration
 * that completed without throwing.
 */
export async function syncAllIntegrations(projectId: string): Promise<SyncResult> {
  const integrations = await prisma.integration.findMany({
    where: { projectId, isActive: true },
  })

  const settled = await Promise.allSettled(integrations.map((i) => runOne(i)))

  const errors: SyncResult["errors"] = []
  const syncedIds: string[] = []

  settled.forEach((outcome, idx) => {
    const integration = integrations[idx]
    if (outcome.status === "fulfilled") {
      syncedIds.push(integration.id)
    } else {
      const reason =
        outcome.reason instanceof Error ? outcome.reason.message : "Неизвестная ошибка"
      errors.push({ platform: integration.platform, error: reason })
    }
  })

  if (syncedIds.length > 0) {
    await prisma.integration.updateMany({
      where: { id: { in: syncedIds } },
      data: { lastSyncAt: new Date() },
    })
  }

  return {
    total: integrations.length,
    succeeded: syncedIds.length,
    failed: errors.length,
    errors,
  }
}
