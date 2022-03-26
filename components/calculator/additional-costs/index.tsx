import { Typography } from 'antd'
import { Wrapper } from '../styles'
import { Project } from '.prisma/client'
import DishWashingSection from './components/dish-washing/dish-washing-section'
import LaborSection from './components/labor/labor-section'
import WasteHaulingSection from './components/waste-hauling/waste-hauling-section'
import OtherExpenseSection from './components/other-expenses/other-expenses-section'
import { useFooterState } from '../footer'
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
      <Typography.Title level={1}>Additional Costs</Typography.Title>
      <Typography.Title level={5}>
        You may incur additional one-time or ongoing expenses or savings from transitioning your operations. For example, storage, dishwashing equipment and labor, and reduced trash hauling services
        can impact your bottom line. This section will help you accurately capture and estimate those additional impacts.
      </Typography.Title>
      <br />
      <LaborSection />
      <br />
      <DishWashingSection />
      <br />
      <WasteHaulingSection />
      <br />
      <OtherExpenseSection />
    </Wrapper>
  )
}
