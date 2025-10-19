import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Popconfirm, Row, Space, Typography } from 'antd';
import Link from 'next/link';
import { useEffect } from 'react';

import { useGetProjectTemplates, useCopyProject, useDeleteProject } from 'client/projects';
import ContentLoader from 'components/common/ContentLoader';
import * as S from 'layouts/styles';
import { PlusOutlined } from '@ant-design/icons';
import projects, { PopulatedProject } from 'pages/api/projects';

export function ProjectTemplates({ isUpstream, tagIdsFilter }: { isUpstream: boolean; tagIdsFilter: string[] }) {
  const { data: templates, isLoading, error, mutate: refreshTemplates } = useGetProjectTemplates();
  const { trigger: triggerCopy, isMutating: copyProjectIsLoading } = useCopyProject();
  const { trigger: triggerDelete, isMutating: deleteProjectIsLoading } = useDeleteProject();

  const handleProjectDeletion = async (projectId: string) => {
    triggerDelete(
      { id: projectId },
      {
        onSuccess: () => {
          message.success(`Project deleted`);
          refreshTemplates();
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
          refreshTemplates();
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

  if (templates?.length === 0) {
    return (
      <Card style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography.Text>There are no project templates yet.</Typography.Text>
      </Card>
    );
  }
  const filteredTemplates =
    (tagIdsFilter.length > 0
      ? templates?.filter(project => {
          return project.tags.some(tag => tagIdsFilter.includes(tag.tagId));
        })
      : templates) || [];

  if (filteredTemplates.length === 0) {
    return (
      <Card style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography.Text>No templates found</Typography.Text>
      </Card>
    );
  }

  return (
    <Row gutter={[20, 20]}>
      {filteredTemplates.map(template => {
        return (
          <Col xs={24} md={12} lg={8} key={template.id}>
            <Card
              style={{ height: '100%', minHeight: 280 }}
              bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ flexGrow: 1 }}>
                <Typography.Title level={3} style={{ marginBottom: 0, paddingRight: 80 }}>
                  {template.name}
                </Typography.Title>
                {isUpstream && (
                  <S.Actions>
                    <Link href={`/projects/${template.id}/edit`} passHref legacyBehavior>
                      <Button icon={<EditOutlined />} type='text' />
                    </Link>

                    <Button
                      onClick={() => handleProjectCopy(template.id)}
                      icon={<CopyOutlined />}
                      type='text'
                      loading={copyProjectIsLoading}
                    />

                    <Popconfirm
                      title={
                        <Space direction='vertical' size='small'>
                          <Typography.Text>
                            Are you sure you want to delete the project &quot;
                            {template.name}&quot;?
                          </Typography.Text>
                        </Space>
                      }
                      onConfirm={() => handleProjectDeletion(template.id)}
                    >
                      <Button icon={<DeleteOutlined />} type='text' loading={deleteProjectIsLoading} />
                    </Popconfirm>
                  </S.Actions>
                )}
                <Typography.Title level={5} style={{ marginTop: 0, whiteSpace: 'pre' }}>
                  {template.templateDescription}
                </Typography.Title>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Button type='primary' block href={`/projects/new?templateId=${template.id}`} icon={<PlusOutlined />}>
                  Use this template
                </Button>
              </div>
              <Button ghost block href={`/projects/${template.id}`}>
                View details
              </Button>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
