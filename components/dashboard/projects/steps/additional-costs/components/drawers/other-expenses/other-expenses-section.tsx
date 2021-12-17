import { Button, Drawer, message, Popconfirm } from 'antd'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useState } from 'react'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../../expense-block'
import { SectionContainer, SectionData, SectionTitle } from '../../styles'
import { useRouter } from 'next/router'
import { AdditionalCost } from '@prisma/client'
import ForecastCard from 'components/forecast-card/forecast-card'
import { PlusOutlined } from '@ant-design/icons'
import { formatToDollar } from 'internal-api/calculator/utils'
import { ADDITIONAL_COST_FREQUENCIES } from 'internal-api/calculator/constants/additional-costs'
import OtherExpensesFormDrawer from './other-expenses-form-drawer'

type Response = {
  additionalCosts: AdditionalCost[]
}

const OtherExpenseSection = () => {
  const route = useRouter()
  const projectId = route.query.id
  const url = `/api/additional-costs/?projectId=${projectId}`
  const { data, refetch } = useSimpleQuery<Response>(url)
  const deleteAdditionalCosts = useSimpleMutation(url, 'DELETE')

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  const onClickAddExpense = () => {
    setIsDrawerVisible(true)
  }

  const onCloseDrawer = () => {
    setIsDrawerVisible(false)
    message.success('Additional expense created')
    refetch()
  }

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id }

    deleteAdditionalCosts.mutate(reqBody, {
      onSuccess: onSuccessDelete,
    })
  }

  const onSuccessDelete = () => {
    message.success('Additional expense deleted')
    refetch()
  }

  const getFrequencyInPlanText = (frequencyNumber: string) => {
    return ADDITIONAL_COST_FREQUENCIES.find(freq => freq.annualOccurrence.toString() === frequencyNumber)?.name
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Other expenses</SectionTitle>
        {!!data?.additionalCosts?.length && (
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />}>
            Add item
          </Button>
        )}
      </SectionContainer>
      {data?.additionalCosts?.length ? (
        data.additionalCosts.map(additionalCost => (
          <SectionContainer key={additionalCost.id}>
            <SectionData>
              <Subtitle>{additionalCost.description}</Subtitle>
              <Popconfirm title="Are you sure to delete this item?" onConfirm={() => onConfirmDelete(additionalCost.id)} okText="Yes" cancelText="No">
                <a href="#">Delete</a>
              </Popconfirm>
            </SectionData>
            <ForecastCard borderTopColor="#5D798E">
              <h4>Forecast</h4>
              <table>
                <thead>
                  <tr>
                    <td>Frequency</td>
                    <td>Total</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{getFrequencyInPlanText(additionalCost.frequency)}</td>
                    <td>{formatToDollar(additionalCost.cost * Number(additionalCost.frequency))}</td>
                  </tr>
                </tbody>
              </table>
            </ForecastCard>
          </SectionContainer>
        ))
      ) : (
        <AddBlock>
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />}>
            Add expense
          </Button>
          <Placeholder>You have no additional expense entries yet. Click &apos;+ Add expense&apos; above to get started.</Placeholder>
        </AddBlock>
      )}
      <Drawer title="Add other expenses" onClose={onCloseDrawer} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <OtherExpensesFormDrawer onClose={onCloseDrawer} />
      </Drawer>
    </Container>
  )
}

export default OtherExpenseSection
