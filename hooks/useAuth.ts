import { useContext } from 'react'
import { AuthContext, Credentials } from 'lib/auth/auth.browser'

export type { Credentials }

export const useAuth = () => useContext(AuthContext)
