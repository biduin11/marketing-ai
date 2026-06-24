import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isApiAuth = pathname.startsWith("/api/auth")
      const isAuthPage =
        pathname === "/login" || pathname === "/register"

      if (isApiAuth) return true

      if (isAuthPage) {
        if (isLoggedIn)
          return Response.redirect(new URL("/", nextUrl))
        return true
      }

      if (!isLoggedIn) return false
      return true
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
