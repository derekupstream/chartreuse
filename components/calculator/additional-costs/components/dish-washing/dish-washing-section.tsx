import { PlusOutlined } from '@ant-design/icons'
import { Dishwasher } from '@prisma/client'
import { Button, Col, Divider, Drawer, message, Popconfirm, Typography, Popover } from 'antd'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import DishwashingFormDrawer from './dishwashing-form-drawer'
import { AddBlock, Container, contentWrapperStyle, Placeholder } from '../expense-block'
import { SectionTitle } from '../styles'
import { InfoCard, InfoRow } from 'components/calculator/styles'
import styled from 'styled-components'
import ContentLoader from 'components/content-loader'
import * as http from 'lib/http'
import { Response } from 'pages/api/dishwasher/index'

const DishWashingSection = () => {
  const route = useRouter()
  const { data, isLoading, refetch } = useSimpleQuery<Response>(`/api/dishwasher?projectId=${route.query.id}`)

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [activeDishwasher, setActivDishwasher] = useState<Dishwasher | null>(null)

  const onClick = () => {
    setIsDrawerVisible(true)
  }

  function onEdit(item: Dishwasher) {
    setActivDishwasher(item)
    setIsDrawerVisible(true)
  }

  const onCloseDrawer = () => {
    setIsDrawerVisible(false)
    setActivDishwasher(null)
  }

  const onSubmit = () => {
    if (activeDishwasher) {
      message.success('Dishwasher updated')
    } else {
      message.success('Dishwasher created')
    }
    setIsDrawerVisible(false)
    refetch()
  }

  const onConfirmDelete = () => {
    http.DELETE(`/api/dishwasher`, { projectId: route.query.id }).then(() => {
      message.success('Dishwasher deleted')
      refetch()
    })
  }

  const pretifyValues = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })

  if (isLoading) {
    return <ContentLoader />
  }

  const utilities = {
    title: 'Utility Rates for ' + data?.state,
    content: (
      <>
        <Typography.Paragraph style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ paddingRight: '1em' }}>
            Electric <span style={{ color: 'grey' }}>($/kWh)</span>:
          </span>
          <span>${data?.rates?.electric}</span>
        </Typography.Paragraph>
        <Typography.Paragraph style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ paddingRight: '1em' }}>
            Gas <span style={{ color: 'grey' }}>($/therm)</span>:
          </span>
          <span>${data?.rates?.gas}</span>
        </Typography.Paragraph>
        <Typography.Paragraph style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ paddingRight: '1em' }}>
            Water <span style={{ color: 'grey' }}>($/thousand gallons)</span>:
          </span>
          <span>${data?.rates?.water}</span>
        </Typography.Paragraph>
      </>
    ),
  }

  return (
    <Container>
      <SectionTitle>Dishwashing</SectionTitle>
      <Typography.Title level={5}>
        Use this section to help calculate dishwashing energy and water costs. Energy and water rates are based on your{' '}
        <Popover content={utilities.content} title={utilities.title} trigger="hover">
          <Typography.Link underline href={`/edit-account/${data?.accountId}`}>
            state average
          </Typography.Link>
        </Popover>
        .
      </Typography.Title>
      <Divider />
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
            <br />
            <a
              href="#"
              onClick={e => {
                onEdit(data.dishwasher)
                e.preventDefault()
              }}
            >
              Edit
            </a>
            <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
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
                    <td>CO2 (lbs/yr)</td>
                    <td>Annual cost</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{pretifyValues(data.stats.electricUsage)} kWh</td>
                    <td>{pretifyValues(data.stats.electricCO2Weight)}</td>
                    <td>$ {data.stats.electricCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>{data.stats.gasUsage.toLocaleString(undefined, { maximumFractionDigits: 2 })} CF</td>
                    <td>{pretifyValues(data.stats.gasCO2Weight)}</td>
                    <td>$ {data.stats.gasCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>{data.stats.waterUsage.toLocaleString(undefined, { maximumFractionDigits: 2 })} gal</td>
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
            <Button onClick={onClick} icon={<PlusOutlined />} type="primary" style={{ paddingRight: '4em', paddingLeft: '4em' }}>
              Add dishwashing
            </Button>
            <Placeholder>You have no dishwashing entries yet. Click &apos;+ Add dishwashing&apos; above to get started.</Placeholder>
          </AddBlock>
        </>
      )}
      <Drawer
        title={activeDishwasher ? 'Update dishwashing expense' : 'Add dishwashing expense'}
        onClose={onCloseDrawer}
        visible={isDrawerVisible}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <DishwashingFormDrawer input={activeDishwasher} onClose={onSubmit} />
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

export default DishWashingSection
