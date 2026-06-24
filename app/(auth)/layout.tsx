import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Zap } from "lucide-react"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect already-authenticated users away from auth pages
  const session = await auth()
  if (session?.user) redirect("/")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
          <Zap className="size-5 text-primary-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            AI Marketing OS
          </p>
          <p className="text-xs text-muted-foreground">
            Маркетинговая операционная система
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  )
}
