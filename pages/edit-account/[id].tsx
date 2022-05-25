import Header from 'components/header'
import { message } from 'antd'
import FormPageTemplate from 'components/form-page-template'
import * as http from 'lib/http'
import { GetServerSideProps } from 'next'
import nookies from 'nookies'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'
import PageLoader from 'components/page-loader'
import prisma from 'lib/prisma'
import { Account } from '@prisma/client'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeftOutlined } from '@ant-design/icons'
import AccountEditForm from 'components/account-edit-form'
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

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: {
        org: {
          include: {
            accounts: {
              where: {
                id: id as string,
              },
              include: {
                users: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/',
        },
      }
    }

    return {
      props: {
        org: user.org,
      },
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

type Props = {
  org: {
    id: string
    accounts: Account[]
  }
}

export default function EditAccount({ org }: Props) {
  const router = useRouter()

  function updateAccount(data: any) {
    chartreuseClient
      .updateAccount({
        id: router.query.id,
        ...data,
      })
      .then(() => {
        message.success('Account edited with success.')
        router.push('/accounts')
      })
      .catch(err => {
        message.error((err as Error)?.message)
      })
  }

  if (!org) return <PageLoader />

  const accountName = org.accounts.find(account => account.id === router.query.id)?.name
  const USState = org.accounts.find(account => account.id === router.query.id)?.USState

  return (
    <>
      <Header title="Edit Account" />

      <main>
        <FormPageTemplate
          title="Edit account"
          navBackLink={
            <Link href="/">
              <a>
                <ArrowLeftOutlined /> back to dashboard
              </a>
            </Link>
          }
        >
          <AccountEditForm onSubmit={updateAccount} onCancel={() => router.push('/accounts')} initialValues={{ name: accountName, USState }} />
        </FormPageTemplate>
      </main>
    </>
  )
}
