import { useRouter } from 'next/router'
import Header from 'components/header'
import SignupForm from 'components/signup-form'
import { useAuth, Credentials } from 'hooks/useAuth'
import { message } from 'antd'
import { FirebaseAuthProvider } from 'lib/auth/firebaseClient'
import FormPageTemplate from 'components/form-page-template'
import { GetServerSideProps } from 'next'
import prisma from 'lib/prisma'
import MessagePage from 'components/message-page'
import PageLoader from 'components/page-loader'

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const inviteId = context.query.inviteId as string

    if (!inviteId) {
      return {
        props: { user: null, org: null, email: null, error: 'Invalid Invite' },
      }
    }

    const invite = await prisma.invite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        sentBy: true,
        org: true,
      },
    })

    if (!invite) {
      return {
        props: { user: null, org: null, email: null, error: 'Invalid Invite' },
      }
    }

    if (invite.accepted) {
      return {
        props: {
          user: null,
          org: null,
          email: null,
          error: 'Invite was already accepted',
        },
      }
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          user: invite.sentBy,
          org: invite.org,
          email: invite.email,
        })
      ),
    }
  } catch (error: any) {
    return { props: { user: null, org: null, error: error.message } }
  }
}

type Props = {
  user?: {
    name: string
    title: string
  }
  org?: {
    name: string
  }
  email?: string
  error?: string
}

export default function Accept({ user, email, org, error }: Props) {
  const { signup, loginWithProvider } = useAuth()
  const router = useRouter()

  const handleSignup = async ({ email, password }: Credentials) => {
    try {
      await signup({ email, password })
      router.push(`/invite-profile-setup?inviteId=${router?.query.inviteId}`)
    } catch (error: any) {
      message.error(error.message)
    }
  }

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider) => {
    try {
      await loginWithProvider(provider)
      router.push(`/invite-profile-setup?inviteId=${router?.query.inviteId}`)
    } catch (error: any) {
      message.error(error.message)
    }
  }

  if (error) {
    return <MessagePage title="Oops!" message={error} />
  }

  if (!user || !org) {
    return <PageLoader />
  }

  return (
    <>
      <Header title="Accept Invite" />

      <main>
        <FormPageTemplate title="Welcome to Chartreuse" subtitle={`${user?.name}, ${user?.title} at ${org?.name} has invited you to create a customer account on Chartreuse.`}>
          <SignupForm onSubmit={handleSignup as (values: unknown) => void} onSubmitWithProvider={handleLoginWithProvider} initialValues={{ email }} />
        </FormPageTemplate>
      </main>
    </>
  )
}
