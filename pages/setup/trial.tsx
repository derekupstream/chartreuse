import { Modal, message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { Header } from 'components/common/Header';
import type { TrialSetupFields } from 'components/setup/trial/TrialSetup';
import { TrialSetupForm } from 'components/setup/trial/TrialSetup';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import { useCreateTrial } from 'lib/api';
import { getUserFromContext } from 'lib/middleware';
import prisma from 'lib/prisma';
import type { SuggestedOrg } from 'pages/api/orgs/suggest';

export const getServerSideProps: GetServerSideProps = async context => {
  const { authUser } = await getUserFromContext(context);
  if (!authUser) {
    return { redirect: { permanent: false, destination: '/login' } };
  }

  const existingUser = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existingUser) {
    return { redirect: { permanent: false, destination: '/projects' } };
  }

  if (authUser.email) {
    const userByEmail = await prisma.user.findUnique({ where: { email: authUser.email } });
    if (userByEmail) {
      await prisma.$executeRaw`UPDATE "User" SET id = ${authUser.id} WHERE id = ${userByEmail.id}`;
      return { redirect: { permanent: false, destination: '/projects' } };
    }
  }

  return { props: {} };
};

type DupeSuggestion = {
  id: string;
  name: string;
  memberCount: number;
  adminName: string | null;
  adminEmail: string | null;
  inviteCode: string | null;
};

export default function TrialSetup() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { trigger, isMutating } = useCreateTrial();

  const [suggestions, setSuggestions] = useState<SuggestedOrg[]>([]);

  // On mount, ask the server which orgs already exist for this user's email
  // domain so we can show them in the form before the user types anything.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/orgs/suggest')
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(data => {
        if (!cancelled) setSuggestions(data.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Show a confirmation modal when the server flags a domain dupe after submit.
  function confirmCreateDespiteDupes(suggestionsFromServer: DupeSuggestion[], retry: () => void) {
    Modal.confirm({
      title: 'Heads up — existing organization detected',
      width: 540,
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            We found {suggestionsFromServer.length} organization
            {suggestionsFromServer.length === 1 ? '' : 's'} for your email domain. If your team is already on
            Chart-Reuse, you should join one of them instead of creating a duplicate.
          </p>
          <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
            {suggestionsFromServer.map(s => (
              <li key={s.id} style={{ marginBottom: 6 }}>
                <strong>{s.name}</strong> ({s.memberCount} member{s.memberCount === 1 ? '' : 's'})
                {s.adminName && (
                  <>
                    {' '}
                    — ask <em>{s.adminName}</em>
                    {s.adminEmail && ` (${s.adminEmail})`} for an invite
                  </>
                )}
                {s.inviteCode && (
                  <>
                    {' '}
                    or use code <code>{s.inviteCode}</code>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p style={{ marginBottom: 0, color: 'rgba(0,0,0,0.65)' }}>Still want to create a separate organization?</p>
        </div>
      ),
      okText: 'Create separate organization',
      cancelText: 'I’ll request an invite',
      onOk() {
        retry();
      }
    });
  }

  const createTrial = useCallback(
    (values: TrialSetupFields & { inviteCode?: string }) => {
      if (!firebaseUser) {
        message.error('There was an error, please refresh your page and try again.');
        return;
      }
      const { title, email, name, phone, orgName, inviteCode } = values;
      const submit = (confirmCreate?: boolean) =>
        trigger(
          { id: firebaseUser.uid, title, email, name, phone, orgName, inviteCode, confirmCreate },
          {
            onSuccess: () => router.push('/projects?view=templates'),
            onError: (err: any) => {
              const status = err?.response?.status ?? err?.status;
              const body = err?.response?.data ?? err?.body;
              if (status === 409 && body?.error === 'org_exists' && Array.isArray(body?.suggestions)) {
                confirmCreateDespiteDupes(body.suggestions, () => submit(true));
              } else {
                message.error(err?.message ?? 'Could not finish setup.');
              }
            }
          }
        );
      submit(false);
    },
    [trigger, router, firebaseUser]
  );

  return (
    <>
      <Header title='Start for free' />
      <main>
        <FormPageTemplate
          title='Create your account'
          subtitle='Set up your organization to get started with Chart-Reuse.'
        >
          <TrialSetupForm
            onSubmit={createTrial as (values: unknown) => void}
            isLoading={isMutating}
            suggestions={suggestions}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}
