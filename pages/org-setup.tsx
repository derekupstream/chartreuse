import { GetServerSideProps } from 'next'
import { useCallback } from 'react'
import { useRouter } from 'next/router'
import OrgSetupForm from 'components/org-setup-form'
import Header from 'components/header'
import { message } from 'antd'
import { useMutation } from 'react-query'
import { useAuth } from 'hooks/useAuth'
import nookies from 'nookies'
import FormPageTemplate from 'components/form-page-template'
import { checkLogin, LoggedinProps } from 'lib/middleware'
import chartreuseClient from 'lib/chartreuseClient'

export const getServerSideProps: GetServerSideProps = async context => {
  const { emailVerified } = nookies.get(context)

  if (!emailVerified) {
    return {
      redirect: {
        permanent: false,
        destination: '/email-verification',
      },
    }
  }

  return { props: { emailVerified: true } }
}

type OrgSetupFields = {
  title: string
  name: string
  phone: string
  orgName: string
  numberOfClientAccounts: string
}

export default function OrgSetup() {
  const router = useRouter()
  const { user } = useAuth()

  const createOrgSetup = useMutation((data: any) => {
    return chartreuseClient.createOrganization(data)
  })

  const handleOrgSetupCreation = useCallback(
    ({ title, name, phone, orgName, numberOfClientAccounts }: OrgSetupFields) => {
      createOrgSetup.mutate(
        {
          id: user?.uid,
          title,
          email: user?.email,
          name,
          phone,
          orgName,
          numberOfClientAccounts,
        },
        {
          onSuccess: () => {
            router.push('/account-setup')
          },
          onError: err => {
            message.error((err as Error)?.message)
          },
        }
      )
    },
    [createOrgSetup, router, user?.uid, user?.email]
  )

  return (
    <>
      <Header title="Org Account" />

      <main>
        <FormPageTemplate
          title="Setup your Organization"
          subtitle="Next, let’s setup your Organization. An Organization could be a company that has multiple customers with multiple locations, or just a single business with a single location."
        >
          <OrgSetupForm onSubmit={handleOrgSetupCreation as (values: unknown) => void} isLoading={createOrgSetup.isLoading} />
        </FormPageTemplate>
      </main>
    </>
  )
}
