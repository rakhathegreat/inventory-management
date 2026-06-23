import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { invoke } from "@tauri-apps/api/core"

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
        const authenticatedUser = await invoke<AuthUser>("login", {
          username,
          password,
        })
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(authenticatedUser)
        )
        setUser(authenticatedUser)
        return authenticatedUser
      },
      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
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
