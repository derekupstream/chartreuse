import { GetServerSideProps } from 'next'
import { useCallback } from 'react'
import { useRouter } from 'next/router'
import InviteProfileForm from 'components/invite-profile-form'
import Header from 'components/header'
import { message } from 'antd'
import { useMutation } from 'react-query'
import { useAuth } from 'hooks/useAuth'
import FormPageTemplate from 'components/form-page-template'
import prisma from 'lib/prisma'
import MessagePage from 'components/message-page'
import PageLoader from 'components/page-loader'

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const inviteId = context.query.inviteId as string

    if (!inviteId) {
      return {
        props: { org: null, account: null, error: 'Invalid Invite' },
      }
    }

    const invite = await prisma.invite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        sentBy: true,
        account: true,
        org: true,
      },
    })

    if (!invite) {
      return {
        props: { org: null, account: null, error: 'Invalid Invite' },
      }
    }

    if (invite.accepted) {
      return {
        props: {
          org: null,
          account: null,
          error: 'Invite was already accepted',
        },
      }
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          org: invite.org,
          account: invite.account,
        })
      ),
    }
  } catch (error: any) {
    return { props: { org: null, account: null, error: error.message } }
  }
}

type InviteProfileFields = {
  name: string
  title: string
  phone: string
}

type Props = {
  org?: {
    id: string
    name: string
  }
  account?: {
    id: string
    name: string
  }
  error?: string
}

export default function InviteProfile({ org, account, error }: Props) {
  const router = useRouter()
  const { user } = useAuth()

  const createInviteProfile = useMutation((data: any) => {
    return fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
      },
    })
  })

  const handleInviteProfileCreation = useCallback(
    async ({ name, title, phone }: InviteProfileFields) => {
      createInviteProfile.mutate(
        {
          id: user?.uid,
          email: user?.email,
          orgId: org?.id,
          accountId: account?.id,
          inviteId: router?.query.inviteId,
          title,
          name,
          phone,
        },
        {
          onSuccess: () => {
            router.push('/')
          },
          onError: err => {
            message.error((err as Error)?.message)
          },
        }
      )
    },
    [account?.id, createInviteProfile, org?.id, router, user?.email, user?.uid]
  )

  if (error) {
    return <MessagePage title="Oops!" message={error} />
  }

  if (!user || !org || !account) {
    return <PageLoader />
  }

  return (
    <>
      <Header title="Setup Profile" />

      <main>
        <FormPageTemplate title="Setup your Profile" subtitle={`Setup your profile to accept the invite to join ${org?.name} and ${account?.name} at Chartreuse.`}>
          <InviteProfileForm onSubmit={handleInviteProfileCreation as (values: unknown) => void} isLoading={createInviteProfile.isLoading} />
        </FormPageTemplate>
      </main>
    </>
  )
}
