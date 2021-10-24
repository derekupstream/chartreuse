import { useCallback } from 'react'
import Header from 'components/header'
import { message } from 'antd'
import FormPageTemplate from 'components/form-page-template'
import { useMutation } from 'react-query'
import { GetServerSideProps } from 'next'
import nookies from 'nookies'
import { verifyIdToken } from 'lib/firebaseAdmin'
import PageLoader from 'components/page-loader'
import prisma from 'lib/prisma'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeftOutlined } from '@ant-design/icons'
import InviteForm from 'components/invite-form'

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: {
        org: {
          include: {
            accounts: true,
          },
        },
      },
    })

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/login',
        },
      }
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          user: user,
          org: user.org,
        })
      ),
    }
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}

type InviteFields = {
  email: string
  accountId: string
}

type Props = {
  user: {
    id: string
  }
  org: {
    id: string
    accounts: {
      id: string
      name: string
    }[]
  }
}

export default function InviteMember({ org, user }: Props) {
  const router = useRouter()

  const createInvite = useMutation((data: any) => {
    return fetch('/api/invite', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
      },
    })
  })

  const handleAccountSetupCreation = useCallback(
    ({ email, accountId }: InviteFields) => {
      createInvite.mutate(
        {
          email,
          accountId,
          userId: user.id,
        },
        {
          onSuccess: () => {
            message.success('Account member invited.')

            router.push('/')
          },
          onError: err => {
            message.error((err as Error)?.message)
          },
        }
      )
    },
    [createInvite, router, user.id]
  )

  if (!org) return <PageLoader />

  const fromDashboard = !!parseInt(router.query.dashboard as string, 10)

  return (
    <>
      <Header title="Org Account" />

      <main>
        <FormPageTemplate
          title="Add a new member to an account"
          subtitle="Select the account to add a new member, and send them an invite to create a profile."
          navBackLink={
            fromDashboard ? (
              <Link href="/">
                <a>
                  <ArrowLeftOutlined /> back to dashboard
                </a>
              </Link>
            ) : undefined
          }
        >
          <InviteForm onSubmit={handleAccountSetupCreation as (values: unknown) => void} isLoading={createInvite.isLoading} accounts={org.accounts} />
        </FormPageTemplate>
      </main>
    </>
  )
}
