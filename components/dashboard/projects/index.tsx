/* eslint-disable react/display-name */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, message, Popconfirm, Row, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Project } from '@prisma/client'
import { ProjectMetadata } from './steps/setup'
import { useRouter } from 'next/router'
import * as S from 'components/dashboard/styles'
import ContentLoader from 'components/content-loader'

const Projects = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data, isLoading, error } = useQuery('projects', async () => {
    const response = await fetch('/api/projects', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    })

    return await response.json()
  })

  const deleteProject = useMutation((id: string) => {
    return fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
      },
    })
  })

  useEffect(() => {
    if (error) {
      message.error((error as Error)?.message)
    }
  }, [error])

  const handleProjectDeletion = async (projectId: string) => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        message.success(`Project deleted`)
        queryClient.invalidateQueries('projects')
      },
      onError: err => {
        message.error((err as Error)?.message)
      },
    })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <S.SpaceBetween>
        <Typography.Title>Projects</Typography.Title>
        <Button onClick={() => router.push('/projects/new')} icon={<PlusOutlined />}>
          Add project
        </Button>
      </S.SpaceBetween>
      {isLoading && <ContentLoader />}
      {!isLoading && data?.projects?.length === 0 && <Typography.Text>You have no active projects. Click ‘+ Add project’ above to get started.</Typography.Text>}
      {!isLoading && data?.projects?.length > 0 && (
        <Row gutter={[20, 20]}>
          {data?.projects?.map((project: Project) => {
            return (
              <Col xs={24} md={12} lg={8} key={project.id}>
                <Card>
                  <Typography.Title level={3}>{project.name}</Typography.Title>
                  <S.ProjectInfo>
                    <S.ProjectType>Location Type</S.ProjectType>
                    <S.Actions>
                      <Popconfirm
                        title={
                          <Space direction="vertical" size="small">
                            <Typography.Text>
                              Are you sure you want to delete the project &quot;
                              {project.name}&quot;?
                            </Typography.Text>
                          </Space>
                        }
                        onConfirm={() => handleProjectDeletion(project.id)}
                      >
                        <Button icon={<DeleteOutlined />} type="text" loading={deleteProject.isLoading} />
                      </Popconfirm>
                    </S.Actions>
                    <Typography.Text>{(project?.metadata as ProjectMetadata)?.type}</Typography.Text>
                  </S.ProjectInfo>
                  <Button type="ghost" block href={`/projects/${project.id}`}>
                    View project
                  </Button>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </Space>
  )
}

export default Projects
