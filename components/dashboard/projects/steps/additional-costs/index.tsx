import { Typography } from 'antd'
import { Wrapper } from '../styles'
import { Project } from '.prisma/client'
import ContentLoader from 'components/content-loader'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import DishWashingSection from './components/drawers/dish-washing/dish-washing-section'
import LaborSection from './components/drawers/labor/labor-section'
import WasteHaulingSection from './components/drawers/waste-hauling/waste-hauling-section'
import OtherExpenseSection from './components/drawers/other-expenses/other-expenses-section'

type ServerSideProps = {
  project: Project
}

type AdditionalCostItem = {
  id: string
  categoryId: string
  cost: number
  frequency: string
  projectId: string
}

export default function AdditionalCosts({ project }: ServerSideProps) {
  // const items = useSimpleQuery(`/api/additional-costs?projectId=${project.id}`)

  // if (items.isLoading) return <ContentLoader />

  return (
    <Wrapper>
      <Typography.Title level={2}>Additional expenses and savings</Typography.Title>
      <Typography.Title level={5}>
        You may incur additional expenses or savings when switching from single-use to reusable products. For example, dishwashing equiptment and labor, and modifications to your facilities. This
        section will help you accurately estimate addtional expenses.
      </Typography.Title>

      <LaborSection />
      <DishWashingSection />
      <WasteHaulingSection />
      <OtherExpenseSection />
    </Wrapper>
  )
}
