import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Drawer, message, Popconfirm, Row, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../expense-block'
import { WasteHaulingCost } from '@prisma/client'
import { SectionContainer, SectionData, SectionTitle } from '../styles'
import { InfoCard, InfoRow } from 'components/calculator/styles'
import styled from 'styled-components'
import { formatToDollar } from 'lib/calculator/utils'
import WasteHaulingFormDrawer from './waste-hauling-form-drawer'
import WasteHaulingSecondFormDrawer from './waste-hauling-second-form-drawer'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { WasteHaulingService } from 'lib/calculator/types/projects'
import ContentLoader from 'components/content-loader'

const annual = 12

interface Response {
  wasteHaulingCosts: WasteHaulingCost[]
}

const WasteHaulingSection = () => {
  const route = useRouter()
  const projectId = route.query.id
  const url = `/api/waste-hauling/?projectId=${projectId}`
  const { data, isLoading, refetch } = useSimpleQuery<Response>(url)
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

  const onCloseForms = () => {
    setIsDrawerVisible(false)
    setIsSecondDrawerVisible(false)
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

  if (isLoading) {
    return <ContentLoader />
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Waste Hauling</SectionTitle>
        {!!data?.wasteHaulingCosts?.length && (
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />} type="primary" style={{ paddingRight: '4em', paddingLeft: '4em' }}>
            Add waste hauling cost
          </Button>
        )}
      </SectionContainer>
      <Divider />
      {data?.wasteHaulingCosts?.length ? (
        data.wasteHaulingCosts.map(wasteHauling => (
          <InfoRow key={wasteHauling.id}>
            <Col span={8}>
              <Subtitle>{wasteHauling.serviceType}</Subtitle>
              <Popconfirm title="Are you sure to delete this item?" onConfirm={() => onConfirmDelete(wasteHauling.id)} okText="Yes" cancelText="No">
                <a href="#">Delete</a>
              </Popconfirm>
            </Col>
            <Col span={8}>
              <InfoCard theme="baseline">
                <Typography.Title level={5}>Baseline</Typography.Title>
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
              </InfoCard>
            </Col>
            <Col span={8}>
              <InfoCard theme="forecast">
                <Typography.Title level={5}>Forecast</Typography.Title>
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
              </InfoCard>
            </Col>
          </InfoRow>
        ))
      ) : (
        <AddBlock>
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />} type="primary" style={{ paddingRight: '4em', paddingLeft: '4em' }}>
            Add waste hauling cost
          </Button>
          <Placeholder>You have no waste hauling entries yet. Click &apos;+ Add waste hauling cost&apos; above to get started.</Placeholder>
        </AddBlock>
      )}
      <Drawer title="Add current monthly waste hauling service fees" onClose={onCloseForms} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <WasteHaulingFormDrawer onClose={onCloseFirstForm} />
      </Drawer>
      <Drawer title="Add forecast for monthly waste hauling service fees" onClose={onCloseForms} visible={isSecondDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
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
