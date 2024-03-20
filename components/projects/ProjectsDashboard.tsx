/* eslint-disable react/display-name */
import { CopyOutlined, DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { DollarOutlined } from '@ant-design/icons';
import type { Project, Account } from '@prisma/client';
import { Button, Card, Col, message, Popconfirm, Row, Space, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import ContentLoader from 'components/common/ContentLoader';
import type { ProjectMetadata } from 'components/projects/[id]/edit';
import { useSubscription } from 'hooks/useSubscription';
import * as S from 'layouts/styles';
import { DELETE, GET, POST } from 'lib/http';

interface PopulatedProject extends Project {
  account: Account;
}

export const ProjectsDashboard = ({ orgId }: { orgId: string }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  //const { subscriptionStatus } = useSubscription();
  const { data, isLoading, error } = useQuery('projects', () => {
    return GET<{ projects: PopulatedProject[] }>('/api/projects');
  });

  const deleteProject = useMutation((id: string) => {
    return DELETE(`/api/projects/${id}`);
  });
  const copyProject = useMutation((id: string) => {
    return POST(`/api/projects/${id}/duplicate`);
  });

  useEffect(() => {
    if (error) {
      message.error((error as Error)?.message);
    }
  }, [error]);

  const handleProjectDeletion = async (projectId: string) => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        message.success(`Project deleted`);
        queryClient.invalidateQueries('projects');
      },
      onError: err => {
        message.error((err as Error)?.message);
      }
    });
  };

  const handleProjectCopy = async (projectId: string) => {
    copyProject.mutate(projectId, {
      onSuccess: () => {
        message.success(`Project duplicated`);
        queryClient.invalidateQueries('projects');
      },
      onError: err => {
        message.error((err as Error)?.message);
      }
    });
  };

  // temporary hack to allow Post-Landfill Action Network to have more projects
  // const projectLimit = orgId === '8793767e-ed9c-4adf-bb45-ba1c45378288' ? 4 : 1;

  // disable the project limit per Derek
  const projectLimitReached = false; // data?.projects && subscriptionStatus !== 'Active' && data.projects.length >= projectLimit;

  function onClickAddProject() {
    if (projectLimitReached) {
      return;
    }
    addProject();
  }

  function addProject() {
    router.push('/projects/new');
  }

  function upgradeAccount() {
    router.push('/subscription');
  }

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <S.SpaceBetween>
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
            onConfirm={addProject}
          > */}
        <Button type='primary' onClick={onClickAddProject} icon={<PlusOutlined />}>
          Add project
        </Button>
        {/* </Popconfirm> */}
        {/* </Popconfirm> */}
      </S.SpaceBetween>
      {isLoading && <ContentLoader />}
      {!isLoading && data?.projects?.length === 0 && (
        <Typography.Text>You have no active projects. Click ‘+ Add project’ above to get started.</Typography.Text>
      )}
      {!isLoading && data?.projects && data?.projects.length > 0 && (
        <Row gutter={[20, 20]}>
          {data?.projects?.map((project: PopulatedProject) => {
            return (
              <Col xs={24} md={12} lg={8} key={project.id}>
                <Card
                  style={{ height: '100%' }}
                  bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <Typography.Title level={3} style={{ marginBottom: 0, paddingRight: 80 }}>
                      {project.name}
                    </Typography.Title>
                    <Typography.Title level={5} style={{ marginTop: 0 }}>
                      {project.account.name}
                    </Typography.Title>
                    <S.Actions>
                      <Link href={`/projects/${project.id}/edit`} passHref legacyBehavior>
                        <Button icon={<EditOutlined />} type='text' />
                      </Link>

                      <Button
                        onClick={() => handleProjectCopy(project.id)}
                        icon={<CopyOutlined />}
                        type='text'
                        loading={copyProject.isLoading}
                      />

                      <Popconfirm
                        title={
                          <Space direction='vertical' size='small'>
                            <Typography.Text>
                              Are you sure you want to delete the project &quot;
                              {project.name}&quot;?
                            </Typography.Text>
                          </Space>
                        }
                        onConfirm={() => handleProjectDeletion(project.id)}
                      >
                        <Button icon={<DeleteOutlined />} type='text' loading={deleteProject.isLoading} />
                      </Popconfirm>
                    </S.Actions>
                    <S.ProjectInfo>
                      <S.ProjectType>Location Type</S.ProjectType>
                      <Typography.Text>{(project?.metadata as ProjectMetadata)?.type}</Typography.Text>
                    </S.ProjectInfo>
                  </div>
                  <Button type='ghost' block href={`/projects/${project.id}`}>
                    View project
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Space>
  );
};
