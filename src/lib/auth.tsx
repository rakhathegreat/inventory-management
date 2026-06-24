import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type UserRole = "admin" | "mitra"

export type AuthUser = {
  id: string
  username: string
  displayName: string
  role: UserRole
  partnerId: string | null
  identityCode: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AUTH_STORAGE_KEY = "arxiva-auth-user"
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (username: string, password: string) => {
        const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/"
        const endpoint = baseUrl.endsWith("/") ? `${baseUrl}auth/login` : `${baseUrl}/auth/login`

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
          let errorMessage = "Login gagal. Periksa kembali username dan password."
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // fallback
          }
          throw errorMessage
        }

        const data = await response.json()
        const authenticatedUser = (data.user || data.data || data) as AuthUser

        if (data.token) {
          localStorage.setItem("arxiva-auth-token", data.token)
        }

        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(authenticatedUser)
        )
        setUser(authenticatedUser)
        return authenticatedUser
      },
      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem("arxiva-auth-token")
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.")
  }

  return context
}
