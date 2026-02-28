import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Org } from '@prisma/client';
import { message, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { OrgEditPage } from 'components/org/edit/OrgEditPage';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import { getUserFromContext } from 'lib/middleware';
import chartreuseClient from 'lib/chartreuseClient';
import { serializeJSON } from 'lib/objects';

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });

  if (!user) {
    return { redirect: { permanent: false, destination: '/login' } };
  }
  if (user.role !== 'ORG_ADMIN') {
    return { redirect: { permanent: false, destination: '/projects' } };
  }

  return {
    props: serializeJSON({ org: user.org })
  };
};

type Props = {
  org: Pick<Org, 'id' | 'name' | 'currency'>;
};

export default function EditAccount({ org }: Props) {
  const router = useRouter();
  console.log(org);
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
