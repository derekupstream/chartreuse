import { useCallback } from 'react'
import Header from 'components/header'
import { message } from 'antd'
import FormPageTemplate from 'components/form-page-template'
import { useMutation } from 'react-query'
import { GetServerSideProps } from 'next'
import nookies from 'nookies'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'
import PageLoader from 'components/page-loader'
import prisma from 'lib/prisma'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeftOutlined } from '@ant-design/icons'
import MemberEditForm from 'components/member-edit-form'
import chartreuseClient from 'lib/chartreuseClient'

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const { id } = context.query

    if (!id) {
      return {
        redirect: {
          permanent: false,
          destination: '/',
        },
      }
    }

    const admin = await prisma.user.findUnique({
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

    const user = await prisma.user.findUnique({
      where: {
        id: id as string,
      },
      include: {
        account: true,
      },
    })

    if (!admin || !user) {
      return {
        redirect: {
          permanent: false,
          destination: '/',
        },
      }
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          user: user,
          org: admin.org,
        })
      ),
    }
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: '/',
      },
    }
  }
}

type MemberEditFields = {
  name: string
  email: string
  title: string
  phone: string
  accountId: string
}

type Props = {
  user: {
    id: string
    name: string
    email: string
    title: string
    phone: string
    account: {
      id: string
    }
  }
  org: {
    id: string
    accounts: {
      id: string
      name: string
    }[]
  }
}

export default function EditMemberProfile({ org, user }: Props) {
  const router = useRouter()

  function handleAccountUpdate(data: MemberEditFields) {
    chartreuseClient
      .updateProfile({
        id: user.id,
        ...data,
      })
      .then(() => {
        message.success('Member edited with success.')

        router.push('/members')
      })
      .catch(err => {
        message.error((err as Error)?.message)
      })
  }

  if (!org) return <PageLoader />

  return (
    <>
      <Header title="Edit Account Member" />

      <main>
        <FormPageTemplate
          title="Edit account member"
          navBackLink={
            <Link href="/">
              <ArrowLeftOutlined /> back to dashboard
            </Link>
          }
        >
          <MemberEditForm
            onSubmit={handleAccountUpdate}
            onCancel={() => router.push('/')}
            initialValues={{
              name: user.name,
              email: user.email,
              title: user.title,
              phone: user.phone,
              accountId: user.account?.id,
            }}
            accounts={org.accounts}
          />
        </FormPageTemplate>
      </main>
    </>
  )
}
