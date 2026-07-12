import type { Metadata } from "next"
import { getProjectByToken } from "@/lib/actions/clientAccess"
import { ClientDashboard } from "@/components/client/client-dashboard"

export const metadata: Metadata = {
  title: "Дашборд проекта",
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getProjectByToken(token)

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-2 text-2xl font-semibold text-foreground">
            Доступ недоступен
          </p>
          <p className="text-sm text-muted-foreground">
            Ссылка недействительна или срок её действия истёк
          </p>
        </div>
      </div>
    )
  }

  return <ClientDashboard data={data} />
}
