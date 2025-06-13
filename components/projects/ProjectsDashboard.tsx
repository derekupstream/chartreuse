import { PlusOutlined } from '@ant-design/icons';
import { Button, Tabs, Typography } from 'antd';
import { useRouter } from 'next/router';

import { useSubscription } from 'hooks/useSubscription';
import * as S from 'layouts/styles';

import { ActiveProjects } from './components/ActiveProjects';
import { ProjectTemplates } from './components/ProjectTemplates';

export const ProjectsDashboard = ({
  isUpstream,
  showTemplateByDefault
}: {
  isUpstream: boolean;
  showTemplateByDefault: boolean;
}) => {
  const router = useRouter();
  //const { subscriptionStatus } = useSubscription();
  // temporary hack to allow Post-Landfill Action Network to have more projects
  // const projectLimit = orgId === '8793767e-ed9c-4adf-bb45-ba1c45378288' ? 4 : 1;

  // disable the project limit per Derek
  const projectLimitReached = false; // data?.projects && subscriptionStatus !== 'Active' && data.projects.length >= projectLimit;

  function upgradeAccount() {
    router.push('/subscription');
  }

  return (
    <>
      <S.HeaderRow>
        <Typography.Title>Projects</Typography.Title>
        {/* <Popconfirm
          title={
            <Space direction='vertical' size='small'>
              <Typography.Title level={5}>Upgrade to add more projects</Typography.Title>
              <Typography.Text>Free trials are limited to {projectLimit} project per account</Typography.Text>
            </Space>
          }
          disabled={!projectLimitReached}
          icon={<DollarOutlined style={{ color: '#95EE49', fontSize: 24 }} />}
          placement='left'
          onConfirm={upgradeAccount}
          okText='Upgrade'
        > */}
        {/* <Popconfirm
            title={
              <Space direction='vertical' size='small'>
                <Typography.Title level={5}>Free project limit reached</Typography.Title>
                <Typography.Text>
                  Additional fees will be charged for adding more than {tier?.projectLimit} projects
                </Typography.Text>
              </Space>
            }
            disabled={!!projectLimitReached}
            icon={<DollarOutlined style={{ color: '#95EE49', fontSize: 24 }} />}
            placement='left'
            onConfirm={newCustomProject}
          > */}
        {!projectLimitReached && (
          <Button href='/projects/new' type='primary' icon={<PlusOutlined />}>
            Start custom project
          </Button>
        )}
      </S.HeaderRow>
      <Tabs
        defaultActiveKey={showTemplateByDefault ? 'templates' : 'active'}
        size={'large'}
        items={[
          {
            label: `Active Projects`,
            key: 'active',
            children: <ActiveProjects />
          },
          {
            label: `Templates`,
            key: 'templates',
            children: <ProjectTemplates isUpstream={isUpstream} />
          }
        ]}
      />
    </>
  );
};
