import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Project, Account } from '@prisma/client';
import { Button, Card, Col, message, Popconfirm, Row, Space, Typography } from 'antd';
import Link from 'next/link';
import { useEffect } from 'react';

import { useCopyProject, useDeleteProject } from 'client/projects';
import { useGetProjects } from 'client/projects';
import ContentLoader from 'components/common/ContentLoader';
import type { ProjectMetadata } from 'components/projects/[id]/edit';
import * as S from 'layouts/styles';

interface PopulatedProject extends Project {
  account: Account;
}

export function ActiveProjects() {
  const { data: { projects } = {}, isLoading, mutate: refreshProjects, error } = useGetProjects();
  const { trigger: triggerCopy, isMutating: copyProjectIsLoading } = useCopyProject();
  const { trigger: triggerDelete, isMutating: deleteProjectIsLoading } = useDeleteProject();

  const handleProjectDeletion = async (projectId: string) => {
    triggerDelete(
      { id: projectId },
      {
        onSuccess: () => {
          message.success(`Project deleted`);
          refreshProjects();
        },
        onError: err => {
          message.error((err as Error)?.message);
        }
      }
    );
  };

  const handleProjectCopy = async (projectId: string) => {
    triggerCopy(
      { id: projectId },
      {
        onSuccess: () => {
          message.success(`Project duplicated`);
          refreshProjects();
        },
        onError: err => {
          message.error((err as Error)?.message);
        }
      }
    );
  };

  useEffect(() => {
    if (error) {
      message.error((error as Error)?.message);
    }
  }, [error]);

  if (isLoading) {
    return <ContentLoader />;
  }

  if (projects?.length === 0) {
    return (
      <Typography.Text>
        You have no active projects. Click ‘+ Start custom project’ above to get started.
      </Typography.Text>
    );
  }

  return (
    <Row gutter={[20, 20]}>
      {projects?.map((project: PopulatedProject) => {
        return (
          <Col xs={24} md={12} lg={8} key={project.id}>
            <Card style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flexGrow: 1 }}>
                <Typography.Title level={3} style={{ marginBottom: 0, paddingRight: 80 }}>
                  {project.name || 'Untitled'}
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
                    loading={copyProjectIsLoading}
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
                    <Button icon={<DeleteOutlined />} type='text' loading={deleteProjectIsLoading} />
                  </Popconfirm>
                </S.Actions>
                <S.ProjectInfo>
                  <S.ProjectType>Location Type</S.ProjectType>
                  <Typography.Text>{(project?.metadata as ProjectMetadata)?.type}</Typography.Text>
                </S.ProjectInfo>
              </div>
              <Button ghost block href={`/projects/${project.id}`}>
                View project
              </Button>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
