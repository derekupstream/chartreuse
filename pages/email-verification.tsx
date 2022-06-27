import { message } from 'antd'
import Header from 'components/header'
import PageLoader from 'components/page-loader'
import { useAuth } from 'hooks/useAuth'
import { useRouter } from 'next/router'
import { destroyCookie, setCookie } from 'nookies'
import { useEffect } from 'react'
import MessagePage from 'components/message-page'

export default function EmailVerification() {
  const { user } = useAuth()
  const router = useRouter()

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''

  useEffect(() => {
    const verifyEmail = async () => {
      destroyCookie(null, 'emailVerified')

      if (user?.emailVerified) {
        setCookie(null, 'emailVerified', 'true')
        router.push('/org-setup')
      } else {
        try {
          console.log('Sending email verification email', { email: user?.email })
          await user?.sendEmailVerification({
            url: `${origin}/org-setup`,
          })
          setCookie(null, 'emailVerified', 'true')
        } catch (error: any) {
          message.error(error.message)
        }
      }
    }

    if (user) {
      verifyEmail()
    }
  }, [origin, router, user])

  if (!user) return <PageLoader />

  return (
    <>
      <Header title="Email verification" />

      <main>
        <MessagePage
          title="Got it!"
          message="Check your email for a link to continue setting up your
            organization."
        />
      </main>
    </>
  )
}
