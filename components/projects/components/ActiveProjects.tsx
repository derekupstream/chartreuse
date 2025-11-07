import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Project, Account, ProjectTagRelation, ProjectTag } from '@prisma/client';
import { Button, Card, Col, Divider, message, Popconfirm, Row, Space, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';

import { useCopyProject, useDeleteProject } from 'client/projects';
import { useGetProjects } from 'client/projects';
import ContentLoader from 'components/common/ContentLoader';
import type { ProjectMetadata } from 'components/projects/[id]/edit/ProjectSetup';
import * as S from 'layouts/styles';

export type SortOrder = 'name' | 'type' | 'created' | 'projectDate' | 'tag';

interface PopulatedProject extends Project {
  account: Account;
  tags: ProjectTagRelation[];
}

interface ActiveProjectsProps {
  tagIdsFilter: string[];
  sortOrder: SortOrder;
  tags: ProjectTag[];
}

export function ActiveProjects({ tagIdsFilter, sortOrder, tags }: ActiveProjectsProps) {
  const { data: { projects } = {}, isLoading, mutate: refreshProjects, error } = useGetProjects();

  const sortedProjects = useMemo<PopulatedProject[]>(() => {
    let projectsToSort = (projects || []).slice();

    // Filter out projects without dates when sorting by projectDate
    if (sortOrder === 'projectDate') {
      projectsToSort = projectsToSort.filter(project => {
        return project.startDate != null;
      });
    }

    return projectsToSort.sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else if (sortOrder === 'type') {
        const typeA = (a.metadata as any)?.type || '';
        const typeB = (b.metadata as any)?.type || '';
        return typeA.toLowerCase().localeCompare(typeB.toLowerCase());
      } else if (sortOrder === 'created') {
        return a.createdAt > b.createdAt ? -1 : 1;
      } else if (sortOrder === 'projectDate') {
        if (!a.startDate || !b.startDate) return 0;
        const dateA = dayjs(a.startDate);
        const dateB = dayjs(b.startDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      } else if (sortOrder === 'tag') {
        // For tag sorting, we'll group by tag in the render section
        return 0;
      }
      return 0;
    });
  }, [projects, sortOrder]);

  const sortedProjectTypes = useMemo<string[]>(() => {
    const typeArr: string[] = [];
    for (let i = 0; i < sortedProjects.length; i++) {
      const type = (sortedProjects[i].metadata as any)?.type;
      if (type !== undefined && type !== null && !typeArr.includes(type)) {
        typeArr.push(type);
      }
    }
    return typeArr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [sortedProjects]);

  const sortedTags = useMemo<string[]>(() => {
    // Get unique tag labels from the tags array (sorted alphabetically, case-insensitive)
    const uniqueTagLabels = Array.from(
      new Set(
        tags
          .filter(tag => sortedProjects.some(project => project.tags.some(pt => pt.tagId === tag.id)))
          .map(tag => tag.label)
      )
    );
    return uniqueTagLabels.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [tags, sortedProjects]);

  const filteredProjects = useMemo(() => {
    return (
      (tagIdsFilter.length > 0
        ? sortedProjects?.filter((project: PopulatedProject) => {
            return project.tags.some(tag => tagIdsFilter.includes(tag.tagId));
          })
        : sortedProjects) || []
    );
  }, [sortedProjects, tagIdsFilter]);

  // Group projects by month for projectDate sorting
  const projectsByMonth = useMemo(() => {
    if (sortOrder !== 'projectDate') return {};
    const grouped: Record<string, PopulatedProject[]> = {};
    filteredProjects.forEach(project => {
      if (project.startDate) {
        const monthKey = dayjs(project.startDate).format('YYYY-MM');
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(project);
      }
    });
    return grouped;
  }, [filteredProjects, sortOrder]);

  // Get sorted month keys (most recent first) for projectDate sorting
  const sortedMonthKeys = useMemo(() => {
    if (sortOrder !== 'projectDate') return [];
    return Object.keys(projectsByMonth).sort((a, b) => {
      return dayjs(b).isBefore(dayjs(a)) ? -1 : 1;
    });
  }, [projectsByMonth, sortOrder]);

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

  if (sortOrder === 'tag') {
    return sortedTags.map(tagLabel => {
      // Find the tag ID for this label
      const tag = tags.find(t => t.label === tagLabel);
      if (!tag) return null;

      // Filter projects that have this tag, then sort alphabetically by name (case-insensitive)
      const projectsWithTag = filteredProjects
        .filter(project => project.tags.some(pt => pt.tagId === tag.id))
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

      return (
        <>
          <Typography.Title level={3} style={{ opacity: 0.4 }}>
            {tagLabel}
          </Typography.Title>
          <Divider style={{ marginTop: 0 }} />
          <Row gutter={[20, 20]}>
            {projectsWithTag.map(project => (
              <Col xs={24} md={12} lg={8} key={`${project.id}-${tag.id}`}>
                <ProjectCard project={project} refreshProjects={refreshProjects} />
              </Col>
            ))}
          </Row>
        </>
      );
    });
  }

  if (sortOrder === 'projectDate') {
    return sortedMonthKeys.map(monthKey => {
      const monthProjects = projectsByMonth[monthKey];
      const monthLabel = dayjs(monthKey).format('MMMM YYYY');

      return (
        <>
          <Typography.Title level={3} style={{ opacity: 0.4 }}>
            {monthLabel}
          </Typography.Title>
          <Divider style={{ marginTop: 0 }} />
          <Row gutter={[20, 20]}>
            {monthProjects.map(project => (
              <Col xs={24} md={12} lg={8} key={project.id}>
                <ProjectCard project={project} refreshProjects={refreshProjects} />
              </Col>
            ))}
          </Row>
        </>
      );
    });
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
