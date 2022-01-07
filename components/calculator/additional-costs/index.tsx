import { Typography } from 'antd'
import { Wrapper } from '../styles'
import { Project } from '.prisma/client'
import ContentLoader from 'components/content-loader'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import DishWashingSection from './components/drawers/dish-washing/dish-washing-section'
import LaborSection from './components/drawers/labor/labor-section'
import WasteHaulingSection from './components/drawers/waste-hauling/waste-hauling-section'
import OtherExpenseSection from './components/drawers/other-expenses/other-expenses-section'
import { useFooterState } from '../footer'
import { SectionHeader } from '../projections/components/styles'
import { useEffect } from 'react'

type ServerSideProps = {
  project: Project
}

export default function AdditionalCosts({ project }: ServerSideProps) {

  const { setFooterState } = useFooterState()
  useEffect(() => {
    setFooterState({ path: '/additional-costs', stepCompleted: true })
  }, [setFooterState])

  return (
    <Wrapper>
      <SectionHeader>Additional expenses and savings</SectionHeader>
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
