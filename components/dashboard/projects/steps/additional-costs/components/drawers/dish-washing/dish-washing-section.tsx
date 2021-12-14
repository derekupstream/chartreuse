import { PlusOutlined } from '@ant-design/icons'
import { Button, Drawer, message, Popconfirm } from 'antd'
import ForecastCard from 'components/forecast-card/forecast-card'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'
import DishwashingFormDrawer from './dishwashing-form-drawer'
import { AddBlock, Container, Placeholder, Subtitle } from '../../expense-block'
import { Box, Data, Options, Title } from './styles'
import { Dishwasher } from '@prisma/client'

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

// interface Dishwasher {
//   id: string
//   additionalRacksPerDay: number
//   boosterWaterHeaterFuelType: string
//   buildingWaterHeaterFuelType: string
//   energyStarCertified: boolean
//   operatingDays: number
//   temperature: string
//   type: string
//   projectId: string
// }

const DishWashingSection = () => {
  const route = useRouter()
  const url = `/api/dishwasher/?projectId=${route.query.id}`
  const { data, refetch } = useSimpleQuery<Response>(url)
  const deleteDishwasher = useSimpleMutation(url, 'DELETE')

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  const onClick = () => {
    setIsDrawerVisible(true)
  }

  const closeDrawer = () => {
    setIsDrawerVisible(false)
  }

  const onCloseDishwashingDrawer = () => {}

  const onConfirmDelete = () => {
    deleteDishwasher.mutate(data?.dishwasher.id, {
      onSuccess: () => {
        message.success('Dishwasher deleted')
        refetch()
      },
    })
  }

  const pretifyValues = (value: number) => value.toFixed(3).replace('.', ',')

  return (
    <Container>
      <Title>Dishwashing</Title>
      <Subtitle>
        Use this section to help calculate dishwashing energy and water costs. Energy and water rates are based on your <u>state average</u>.
      </Subtitle>
      {data?.dishwasher ? (
        <Box>
          <Data>
            <Title>{data.dishwasher.type}</Title>
            <Options>
              {data.dishwasher.temperature}
              {', '}
              {data.dishwasher.energyStarCertified ? 'Energy star certified,' : null} {data.dishwasher.boosterWaterHeaterFuelType}{' '}
            </Options>
            <Popconfirm title="Are you sure to delete this item?" onConfirm={onConfirmDelete} okText="Yes" cancelText="No">
              <a href="#">Delete</a>
            </Popconfirm>
          </Data>
          <ForecastCard borderTopColor="#5D798E">
            <h4>Forecast</h4>
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
                  <td>{data.stats.electricUsage}</td>
                  <td>{pretifyValues(data.stats.electricCO2Weight)}</td>
                  <td>$ {data.stats.electricCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>{data.stats.gasUsage}</td>
                  <td>{pretifyValues(data.stats.gasCO2Weight)}</td>
                  <td>$ {data.stats.gasCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>{data.stats.waterUsage}</td>
                  <td>-</td>
                  <td>$ {data.stats.waterCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </ForecastCard>
        </Box>
      ) : (
        <>
          <AddBlock>
            <Button onClick={onClick} icon={<PlusOutlined />}>
              Add expense
            </Button>
            <Placeholder>You have no dishwashing entries yet. Click &apos;+ Add expense&apos; above to get started.</Placeholder>
          </AddBlock>
          <Drawer title="Add dishwashing expense" onClose={closeDrawer} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
            <DishwashingFormDrawer onCloseDishwashingDrawer={onCloseDishwashingDrawer} />
          </Drawer>
        </>
      )}
    </Container>
  )
}

const contentWrapperStyle = { width: '600px' }

export default DishWashingSection
