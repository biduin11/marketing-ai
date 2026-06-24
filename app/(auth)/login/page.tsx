"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema } from "@/lib/validations/auth"

interface FormErrors {
  email?: string[]
  password?: string[]
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [form, setForm] = useState({ email: "", password: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const parsed = loginSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(
        parsed.error.flatten().fieldErrors as FormErrors
      )
      return
    }

    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Неверный email или пароль")
      } else {
        router.replace("/")
        router.refresh()
      }
    } catch {
      setError("Произошла ошибка. Попробуйте ещё раз.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-base font-semibold text-foreground">Вход</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Войдите в свой аккаунт
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            aria-invalid={!!fieldErrors.email}
            disabled={loading}
          />
          {fieldErrors.email?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            aria-invalid={!!fieldErrors.password}
            disabled={loading}
          />
          {fieldErrors.password?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.password[0]}</p>
          )}
        </div>

        {/* Global error */}
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          Войти
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </>
  )
}
