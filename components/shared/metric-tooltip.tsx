"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MetricTooltipProps {
  formula: string
  description?: string
}

export function MetricTooltip({ formula, description }: MetricTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="size-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {description && (
            <p className="mb-1 text-xs text-muted-foreground">{description}</p>
          )}
          <p className="font-mono text-xs">{formula}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const METRIC_FORMULAS = {
  roi: {
    formula: "ROI = (Выручка − Расходы) / Расходы × 100%",
    description: "Возврат на инвестиции в маркетинг",
  },
  romi: {
    formula: "ROMI = Выручка / Расходы × 100%",
    description: "Возврат на маркетинговые инвестиции",
  },
  cac: {
    formula: "CAC = Расходы / Количество лидов",
    description: "Стоимость привлечения одного клиента",
  },
  ctr: {
    formula: "CTR = Клики / Показы × 100%",
    description: "Кликабельность объявлений",
  },
  cr: {
    formula: "CR = Лиды / Клики × 100%",
    description: "Конверсия из клика в лид",
  },
  cpc: {
    formula: "CPC = Расходы / Клики",
    description: "Стоимость одного клика",
  },
  ltv: {
    formula: "LTV = Средний чек × Кол-во покупок × Срок жизни клиента",
    description: "Пожизненная ценность клиента",
  },
  spend: {
    formula: "Суммарные расходы по всем каналам за период",
    description: "Маркетинговый бюджет",
  },
  revenue: {
    formula: "Суммарная выручка по всем каналам за период",
    description: "Доход от маркетинговых активностей",
  },
} as const
