import { Skeleton } from "@/components/ui/skeleton"

export default function AuditLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 space-y-2 text-center">
        <Skeleton className="mx-auto h-7 w-72" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
