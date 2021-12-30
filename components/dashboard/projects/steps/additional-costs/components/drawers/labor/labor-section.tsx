import { Button, Drawer, message, Popconfirm } from 'antd'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useEffect, useState } from 'react'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../../expense-block'
import { SectionContainer, SectionData, SectionTitle } from '../../styles'
import { useRouter } from 'next/router'
import { LaborCost } from '@prisma/client'
import LaborFormDrawer from './labor-form-drawer'
import ForecastCard from 'components/forecast-card/forecast-card'
import { PlusOutlined } from '@ant-design/icons'
import { formatToDollar } from 'internal-api/calculator/utils'
import { OTHER_EXPENSES_FREQUENCIES } from 'internal-api/calculator/constants/other-expenses'
import ContentLoader from 'components/content-loader'

type Response = {
  laborCosts: LaborCost[]
}

const LaborSection = () => {
  const route = useRouter()
  const projectId = route.query.id
  const url = `/api/labor-costs/?projectId=${projectId}`
  const { data, isLoading, refetch } = useSimpleQuery<Response>(url)
  const deleteLabor = useSimpleMutation(url, 'DELETE')

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  const onClickAddExpense = () => {
    setIsDrawerVisible(true)
  }

  const onCloseDrawer = () => {
    setIsDrawerVisible(false)
  }

  const onSubmit = () => {
    setIsDrawerVisible(false)
    message.success('Labor created')
    refetch()
  }

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id }

    deleteLabor.mutate(reqBody, {
      onSuccess: () => {
        message.success('Labor deleted')
        refetch()
      },
    })
  }

  const getFrequencyInNumber = (name: string) => {
    return OTHER_EXPENSES_FREQUENCIES.find(freq => freq.name.toString() === name)?.annualOccurrence! || 1
  }

  if (isLoading) {
    return <ContentLoader />
  }
  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Labor</SectionTitle>
        {!!data?.laborCosts?.length && (
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />}>
            Add item
          </Button>
        )}
      </SectionContainer>
      {data?.laborCosts?.length ? (
        data.laborCosts.map(labor => (
          <SectionContainer key={labor.id}>
            <SectionData>
              <Subtitle>{labor.description}</Subtitle>
              <Popconfirm title="Are you sure to delete this item?" onConfirm={() => onConfirmDelete(labor.id)} okText="Yes" cancelText="No">
                <a href="#">Delete</a>
              </Popconfirm>
            </SectionData>
            <ForecastCard borderTopColor="#5D798E">
              <h4>Forecast</h4>
              <table>
                <thead>
                  <tr>
                    <td>Frequency</td>
                    <td></td>
                    {/* <td>Weekly total</td> */}
                    <td>Annual total</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{labor.frequency}</td>
                    <td></td>
                    {/* <td>{formatToDollar(labor.cost)}</td> */}
                    <td>{formatToDollar(labor.cost * getFrequencyInNumber(labor.frequency))}</td>
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
          <Placeholder>You have no labor entries yet. Click &apos;+ Add expense&apos; above to get started.</Placeholder>
        </AddBlock>
      )}
      <Drawer title="Add labor expense" onClose={onCloseDrawer} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <LaborFormDrawer onClose={onSubmit} />
      </Drawer>
    </Container>
  )
}

export default LaborSection
