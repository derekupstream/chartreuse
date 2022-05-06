import { useRouter } from 'next/router'
import Header from 'components/header'
import LoginForm from 'components/login-form'
import { useAuth, Credentials } from 'hooks/useAuth'
import { message } from 'antd'
import { useEffect } from 'react'
import { FirebaseAuthProvider } from 'lib/auth/firebaseClient'
import FormPageTemplate from 'components/form-page-template'

export default function Login() {
  const { login, loginWithProvider, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // this may occur when the user is logged in already, but the cookie needed to be refreshed on the frontend
    if (user) {
      router.push('/')
    }
  }, [user])

  const handleLogin = async ({ email, password }: Credentials) => {
    try {
      await login({ email, password })
      router.push('/')
    } catch (error: any) {
      message.error(error.message)
    }
  }

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider) => {
    try {
      await loginWithProvider(provider)
      router.push('/projects')
    } catch (error: any) {
      message.error(error.message)
    }
  }

  return (
    <>
      <Header title="Sign in" />

      <main>
        <FormPageTemplate title="Welcome to Chart Reuse" subtitle="Sign in with your email and password, or use your Google account.">
          <LoginForm onSubmit={handleLogin as (values: unknown) => void} onSubmitWithProvider={handleLoginWithProvider} />
        </FormPageTemplate>
      </main>
    </>
  )
}
