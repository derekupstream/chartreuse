import { PlusOutlined } from '@ant-design/icons'
import { Button, Drawer, message, Popconfirm, Row } from 'antd'
import ForecastCard from 'components/forecast-card/forecast-card'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import WasteHaulingFormDrawer from './waste-hauling-form-drawer'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../../expense-block'
import { WasteHaulingCost } from '@prisma/client'
import { SectionContainer, SectionData, SectionTitle } from '../../styles'
import styled from 'styled-components'
import { formatToDollar } from 'internal-api/calculator/utils'

const annual = 12

interface Response {
  wasteHaulingCosts: WasteHaulingCost[]
}

const WasteHaulingSection = () => {
  const route = useRouter()
  const projectId = route.query.id
  const url = `/api/waste-hauling/?projectId=${projectId}`
  const { data, refetch } = useSimpleQuery<Response>(url)
  const deleteWasteHauling = useSimpleMutation(url, 'DELETE')

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  const onClickAddExpense = () => {
    setIsDrawerVisible(true)
  }

  const onClose = () => {
    setIsDrawerVisible(false)
    message.success('Waste Hauling created')
    refetch()
  }

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id }

    deleteWasteHauling.mutate(reqBody, {
      onSuccess: () => {
        message.success('Waste Hauling deleted')
        refetch()
      },
    })
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Waste Hauling</SectionTitle>
        {!!data?.wasteHaulingCosts?.length && (
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />}>
            Add item
          </Button>
        )}
      </SectionContainer>
      {data?.wasteHaulingCosts.length ? (
        data.wasteHaulingCosts.map(wasteHauling => (
          <SectionContainer key={wasteHauling.id}>
            <SectionData>
              <Subtitle>{wasteHauling.serviceType}</Subtitle>
              <Popconfirm title="Are you sure to delete this item?" onConfirm={() => onConfirmDelete(wasteHauling.id)} okText="Yes" cancelText="No">
                <a href="#">Delete</a>
              </Popconfirm>
            </SectionData>
            <Row>
              <ForecastCard borderTopColor="#1aD78E" css="margin-right: 16px;">
                <h4>Baseline</h4>
                <table>
                  <thead>
                    <tr>
                      <td>Collection frequency</td>
                      <td>Monthly total</td>
                      <td>Annual total</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Monthly</td>
                      <td>{formatToDollar(wasteHauling.monthlyCost)}</td>
                      <td>{formatToDollar(wasteHauling.monthlyCost * annual)}</td>
                    </tr>
                  </tbody>
                </table>
              </ForecastCard>
              <ForecastCard borderTopColor="#5D798E">
                <h4>Forecast</h4>
                <table>
                  <thead>
                    <tr>
                      <td>Collection frequency</td>
                      <td>Monthly total</td>
                      <td>Annual total</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Monthly</td>
                      <td>{formatToDollar(wasteHauling.monthlyCost)}</td>
                      <td>{formatToDollar(wasteHauling.monthlyCost * annual)}</td>
                    </tr>
                  </tbody>
                </table>
              </ForecastCard>
            </Row>
          </SectionContainer>
        ))
      ) : (
        <AddBlock>
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />}>
            Add expense
          </Button>
          <Placeholder>You have no waste hauling entries yet. Click &apos;+ Add expense&apos; above to get started.</Placeholder>
        </AddBlock>
      )}
      <Drawer title="Waste hauling entries" onClose={onClose} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <WasteHaulingFormDrawer onClose={onClose} />
      </Drawer>
    </Container>
  )
}

const Options = styled.span`
  font-size: 14px;
  line-height: 24px;
  font-weight: 700;
  margin: 8px 0;
`

export default WasteHaulingSection
