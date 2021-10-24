import { useContext } from 'react'
import { AuthContext, Credentials } from 'lib/auth'

export type { Credentials }

export const useAuth = () => useContext(AuthContext)
