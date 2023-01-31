/* eslint-disable react/display-name */
import { DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { Project, Account } from '@prisma/client';
import { Button, Card, Col, message, Popconfirm, Row, Space, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import ContentLoader from 'components/content-loader';
import * as S from 'components/dashboard/styles';
import type { ProjectMetadata } from 'components/projects/[id]/edit';
import { DELETE, GET } from 'lib/http';

interface PopulatedProject extends Project {
  account: Account;
}

const Projects = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, isLoading, error } = useQuery('projects', () => {
    return GET<{ projects: PopulatedProject[] }>('/api/projects');
  });

  const deleteProject = useMutation((id: string) => {
    return DELETE(`/api/projects/${id}`);
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

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <S.SpaceBetween>
        <Typography.Title>Projects</Typography.Title>
        <Button type='primary' onClick={() => router.push('/projects/new')} icon={<PlusOutlined />}>
          Add project
        </Button>
      </S.SpaceBetween>
      {isLoading && <ContentLoader />}
      {!isLoading && data?.projects?.length === 0 && <Typography.Text>You have no active projects. Click ‘+ Add project’ above to get started.</Typography.Text>}
      {!isLoading && data?.projects && data?.projects.length > 0 && (
        <Row gutter={[20, 20]}>
          {data?.projects?.map((project: PopulatedProject) => {
            return (
              <Col xs={24} md={12} lg={8} key={project.id}>
                <Card style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flexGrow: 1 }}>
                    <Typography.Title level={3} style={{ marginBottom: 0, paddingRight: 20 }}>
                      {project.name}
                    </Typography.Title>
                    <Typography.Title level={5} style={{ marginTop: 0 }}>
                      {project.account.name}
                    </Typography.Title>
                    <S.ProjectInfo>
                      <S.ProjectType>Location Type</S.ProjectType>
                      <S.Actions>
                        <Link href={`/projects/${project.id}/edit`} passHref legacyBehavior>
                          <Button icon={<EditOutlined />} type='text' />
                        </Link>
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

export default Projects;
