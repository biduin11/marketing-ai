"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerSchema } from "@/lib/validations/auth"
import { registerUser } from "@/lib/actions/auth"

interface FormErrors {
  name?: string[]
  email?: string[]
  password?: string[]
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})

    const parsed = registerSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(
        parsed.error.flatten().fieldErrors as FormErrors
      )
      return
    }

    setLoading(true)
    try {
      const result = await registerUser(parsed.data)
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as FormErrors)
        } else {
          toast.error(result.error)
        }
        return
      }
      toast.success("Аккаунт создан! Войдите в систему.")
      router.push("/login")
    } catch {
      toast.error("Произошла ошибка. Попробуйте ещё раз.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-base font-semibold text-foreground">Регистрация</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Создайте аккаунт, чтобы начать работу
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input
            id="name"
            placeholder="Иван Иванов"
            autoComplete="name"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            aria-invalid={!!fieldErrors.name}
            disabled={loading}
          />
          {fieldErrors.name?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.name[0]}</p>
          )}
        </div>

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
            placeholder="Минимум 8 символов"
            autoComplete="new-password"
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          Создать аккаунт
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Войти
        </Link>
      </p>
    </>
  )
}
