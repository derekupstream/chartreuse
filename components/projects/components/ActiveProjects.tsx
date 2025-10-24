import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Project, Account, ProjectTagRelation } from '@prisma/client';
import { Button, Card, Col, Divider, message, Popconfirm, Row, Space, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { useCopyProject, useDeleteProject } from 'client/projects';
import { useGetProjects } from 'client/projects';
import ContentLoader from 'components/common/ContentLoader';
import type { ProjectMetadata } from 'components/projects/[id]/edit/ProjectSetup';
import * as S from 'layouts/styles';

export type SortOrder = 'name' | 'type' | 'created' | 'projectDate';

interface PopulatedProject extends Project {
  account: Account;
  tags: ProjectTagRelation[];
}

export function ActiveProjects({ tagIdsFilter, sortOrder }: { tagIdsFilter: string[]; sortOrder: SortOrder }) {
  const { data: { projects } = {}, isLoading, mutate: refreshProjects, error } = useGetProjects();

  const sortedProjects = useMemo<PopulatedProject[]>(() => {
    return (projects || []).sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOrder === 'type') {
        return (a.metadata as any)?.type.localeCompare((b.metadata as any)?.type);
      } else if (sortOrder === 'created') {
        return a.createdAt > b.createdAt;
      }
    });
  }, [projects, sortOrder]);

  const sortedProjectTypes = useMemo<string[]>(() => {
    const typeArr: string[] = [];
    for (let i = 0; i < sortedProjects.length; i++) {
      const type = (sortedProjects[i].metadata as any)?.type;
      if (type !== undefined && !typeArr.includes(type)) {
        typeArr.push(type);
      }
    }
    return typeArr.sort();
  }, [sortedProjects]);

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
      <Card style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography.Text>
          You have no active projects. Select a template or click <strong>+ Start custom project</strong> above to get
          started.
        </Typography.Text>
      </Card>
    );
  }

  const filteredProjects =
    (tagIdsFilter.length > 0
      ? sortedProjects?.filter((project: PopulatedProject) => {
          return project.tags.some(tag => tagIdsFilter.includes(tag.tagId));
        })
      : projects) || [];

  if (filteredProjects.length === 0) {
    return (
      <Card style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography.Text>No projects found</Typography.Text>
      </Card>
    );
  }

  if (sortOrder === 'type') {
    return sortedProjectTypes.map(type => (
      <>
        <Typography.Title level={3} style={{ opacity: 0.4 }}>
          {type}
        </Typography.Title>
        <Divider style={{ marginTop: 0 }} />
        <Row gutter={[20, 20]}>
          {filteredProjects
            .filter(project => (project.metadata as any)?.type === type)
            .map(project => (
              <Col xs={24} md={12} lg={8} key={project.id}>
                <ProjectCard project={project} refreshProjects={refreshProjects} />
              </Col>
            ))}
        </Row>
      </>
    ));
  }

  return (
    <Row gutter={[20, 20]}>
      {sortedProjects.map((project: PopulatedProject) => {
        return (
          <Col xs={24} md={12} lg={8} key={project.id}>
            <ProjectCard project={project} refreshProjects={refreshProjects} />
          </Col>
        );
      })}
    </Row>
  );
}

function ProjectCard({ project, refreshProjects }: { project: PopulatedProject; refreshProjects: () => void }) {
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
  return (
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
          <S.ProjectType>Project Type</S.ProjectType>
          <Typography.Text>{(project?.metadata as ProjectMetadata)?.type}</Typography.Text>
        </S.ProjectInfo>
      </div>
      <Button ghost block href={`/projects/${project.id}`}>
        View project
      </Button>
    </Card>
  );
}
