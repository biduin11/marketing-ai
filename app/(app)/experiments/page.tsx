import { FlaskConical } from "lucide-react"

export default function ExperimentsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FlaskConical className="size-5" />
          Эксперименты
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Проверяйте гипотезы и фиксируйте результаты A/B тестов
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-[#eaeaea] bg-white py-20 text-center shadow-sm">
        <FlaskConical className="mx-auto size-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-foreground">Раздел в разработке</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
          Здесь вы сможете создавать гипотезы, запускать A/B тесты
          и получать рекомендации AI на основе результатов.
        </p>
      </div>
    </div>
  )
}
