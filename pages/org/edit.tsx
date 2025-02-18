import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Org } from '@prisma/client';
import { message, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { OrgEditPage } from 'components/org/edit/OrgEditPage';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import chartreuseClient from 'lib/chartreuseClient';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid
      },
      include: {
        org: true
      }
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/'
        }
      };
    }
    if (user.role !== 'ORG_ADMIN') {
      console.warn('User is not an org admin', { user });
      return {
        redirect: {
          permanent: false,
          destination: '/'
        }
      };
    }

    return {
      props: serializeJSON({
        org: user.org
      })
    };
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: '/'
      }
    };
  }
};

type Props = {
  org: Pick<Org, 'id' | 'name' | 'currency'>;
};

export default function EditAccount({ org }: Props) {
  const router = useRouter();

  const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : null;

  function updateOrg(data: any) {
    chartreuseClient
      .updateOrganization(org.id, data)
      .then(() => {
        message.success('Organization edited successfully.');
        if (redirect) {
          router.push(redirect);
        }
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  if (!org) return <PageLoader />;

  return (
    <>
      <Header title='Edit Organization' />

      <main>
        <FormPageTemplate
          title='Edit organization'
          navBackLink={
            <Link href='/' passHref legacyBehavior>
              <Typography.Link>
                <ArrowLeftOutlined /> back to dashboard
              </Typography.Link>
            </Link>
          }
        >
          <OrgEditPage
            onSubmit={updateOrg}
            onCancel={redirect ? () => router.push(redirect) : undefined}
            initialValues={org}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}
