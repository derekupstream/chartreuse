import { PlusOutlined } from '@ant-design/icons'
import { Button, Drawer, message, Popconfirm, Row } from 'antd'
import ForecastCard from 'components/forecast-card/forecast-card'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../../expense-block'
import { WasteHaulingCost } from '@prisma/client'
import { SectionContainer, SectionData, SectionTitle } from '../../styles'
import styled from 'styled-components'
import { formatToDollar } from 'internal-api/calculator/utils'
import WasteHaulingFormDrawer from './waste-hauling-form-drawer'
import WasteHaulingSecondFormDrawer from './waste-hauling-second-form-drawer'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { WasteHaulingService } from 'internal-api/calculator/types/projects'

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
  const createWasteHaulingCost = useSimpleMutation(url, 'POST')
  const [formValues, setFormValues] = useState({})

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [isSecondDrawerVisible, setIsSecondDrawerVisible] = useState(false)

  const onClickAddExpense = () => {
    setIsDrawerVisible(true)
  }

  const onCloseFirstForm = (formValues?: WasteHaulingService) => {
    if (formValues) setFormValues(formValues)
    setIsDrawerVisible(false)
    setIsSecondDrawerVisible(true)
  }

  const onCloseSecondForm = (newMonthlyCost: number) => {
    const values = {
      ...formValues,
      newMonthlyCost,
    }
    createWasteHaulingCost.mutate(values, {
      onSuccess: onSuccessSecondFormSubmit,
    })
  }

  const onSuccessSecondFormSubmit = () => {
    message.success('Waste Hauling created')
    setIsSecondDrawerVisible(false)
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
      {data?.wasteHaulingCosts?.length ? (
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
                      <td>{formatToDollar(wasteHauling.newMonthlyCost)}</td>
                      <td>{formatToDollar(wasteHauling.newMonthlyCost * annual)}</td>
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
      <Drawer title="Add Current Waste Hauling Service" visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <WasteHaulingFormDrawer onClose={onCloseFirstForm} />
      </Drawer>
      <Drawer title="Add Forecast for Waste Hauling Service" visible={isSecondDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <WasteHaulingSecondFormDrawer onClose={onCloseSecondForm} />
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
