"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportPdfButtonProps {
  printAreaId: string
  filename?: string
  size?: "sm" | "default"
}

export function ExportPdfButton({
  printAreaId,
  filename = "export",
  size = "sm",
}: ExportPdfButtonProps) {
  function handlePrint() {
    const el = document.getElementById(printAreaId)
    if (!el) return

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    // Collect all stylesheets
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n")
        } catch {
          // Cross-origin stylesheets
          return sheet.href ? `@import url("${sheet.href}");` : ""
        }
      })
      .join("\n")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${filename}</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; padding: 24px; background: white; }
              .no-print { display: none !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: system-ui, sans-serif; color: #111; background: white; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return (
    <Button variant="outline" size={size} onClick={handlePrint} className="gap-1.5">
      <Download className="size-3.5" />
      Экспорт PDF
    </Button>
  )
}
