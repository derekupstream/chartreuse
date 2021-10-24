import { Typography } from 'antd'
import { useEffect } from 'react'
import { AdditionalCost } from 'api/calculator/types/projects'
import { GET } from 'lib/http'
import { Project } from '.prisma/client'
import * as S from '../styles'

type ServerSideProps = {
  project: Project
}

export default function AdditionalCosts({ project }: ServerSideProps) {
  useEffect(() => {
    getAdditionalCosts()
  }, [])

  async function getAdditionalCosts() {
    try {
      const { additionalCosts } = await GET<{
        additionalCosts: AdditionalCost[]
      }>(`/api/projects/${project.id}/additional-costs`)
      console.log('additionalCosts', additionalCosts)
    } catch (error) {
      console.error(error)
      //
    }
  }

  return (
    <S.Wrapper>
      <Typography.Title level={2}>Additional Costs</Typography.Title>
    </S.Wrapper>
  )
}
