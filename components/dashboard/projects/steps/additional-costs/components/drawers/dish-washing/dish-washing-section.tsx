import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, Drawer, message, Popconfirm, Typography } from 'antd'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'
import DishwashingFormDrawer from './dishwashing-form-drawer'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../../expense-block'
import { Dishwasher } from '@prisma/client'
import { SectionContainer, SectionData, SectionTitle } from '../../styles'
import { InfoCard, InfoRow } from 'components/dashboard/projects/steps/styles'
import styled from 'styled-components'
import ContentLoader from 'components/content-loader'

interface Response {
  dishwasher: Dishwasher
  stats: Stats
}

interface Stats {
  electricUsage: number
  electricCO2Weight: number
  electricCost: number
  gasUsage: number
  gasCO2Weight: number
  gasCost: number
  waterUsage: number
  waterCost: number
}

const DishWashingSection = () => {
  const route = useRouter()
  const url = `/api/dishwasher/?projectId=${route.query.id}`
  const { data, isLoading, refetch } = useSimpleQuery<Response>(url)
  const deleteDishwasher = useSimpleMutation(url, 'DELETE')

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  const onClick = () => {
    setIsDrawerVisible(true)
  }

  const onCloseDrawer = () => {
    setIsDrawerVisible(false)
  }

  const onSubmit = () => {
    setIsDrawerVisible(false)
    message.success('Dishwasher created')
    refetch()
  }

  const onConfirmDelete = () => {
    deleteDishwasher.mutate(data?.dishwasher.id, {
      onSuccess: () => {
        message.success('Dishwasher deleted')
        refetch()
      },
    })
  }

  const pretifyValues = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })

  if (isLoading) {
    return <ContentLoader />
  }

  return (
    <Container>
      <SectionTitle>Dishwashing</SectionTitle>
      <Subtitle>
        Use this section to help calculate dishwashing energy and water costs. Energy and water rates are based on your <u>state average</u>.
      </Subtitle>
      {data?.dishwasher ? (
        <InfoRow>
          <Col span={16} flex-direction="column">
            <SectionTitle>{data.dishwasher.type}</SectionTitle>
            <br />
            <Options>
              {data.dishwasher.temperature ? data.dishwasher.temperature + ' Temperature, ' : ''}
              {data.dishwasher.energyStarCertified ? 'Energy star certified' : null} {data.dishwasher.boosterWaterHeaterFuelType} Fuel
            </Options>
            <br />
            <Popconfirm title="Are you sure to delete this item?" onConfirm={onConfirmDelete} okText="Yes" cancelText="No">
              <a href="#">Delete</a>
            </Popconfirm>
          </Col>
          <Col span={8}>
            <InfoCard theme="forecast">
              <Typography.Title level={5}>Forecast</Typography.Title>
              <table>
                <thead>
                  <tr>
                    <td>Annual usage</td>
                    <td>Lbs. CO2/yr.</td>
                    <td>Annual total</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{pretifyValues(data.stats.electricUsage)}</td>
                    <td>{pretifyValues(data.stats.electricCO2Weight)}</td>
                    <td>$ {data.stats.electricCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>{data.stats.gasUsage.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{pretifyValues(data.stats.gasCO2Weight)}</td>
                    <td>$ {data.stats.gasCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>{data.stats.waterUsage.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>-</td>
                    <td>$ {data.stats.waterCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </InfoCard>
          </Col>
        </InfoRow>
      ) : (
        <>
          <AddBlock>
            <Button onClick={onClick} icon={<PlusOutlined />}>
              Add expense
            </Button>
            <Placeholder>You have no dishwashing entries yet. Click &apos;+ Add expense&apos; above to get started.</Placeholder>
          </AddBlock>
          <Drawer title="Add dishwashing expense" onClose={onCloseDrawer} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
            <DishwashingFormDrawer onClose={onSubmit} />
          </Drawer>
        </>
      )}
    </Container>
  )
}

const Options = styled.span`
  font-size: 14px;
  line-height: 24px;
  font-weight: 700;
  margin: 8px 0;
`

export default DishWashingSection
