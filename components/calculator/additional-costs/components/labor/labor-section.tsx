import { Button, Col, Divider, Drawer, message, Popconfirm, Typography } from 'antd'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useState } from 'react'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../expense-block'
import { SectionContainer, SectionTitle } from '../styles'
import { InfoCard, InfoRow } from 'components/calculator/styles'
import { useRouter } from 'next/router'
import { LaborCost } from '@prisma/client'
import LaborFormDrawer from './labor-form-drawer'
import { PlusOutlined } from '@ant-design/icons'
import { formatToDollar } from 'lib/calculator/utils'
import { OTHER_EXPENSES_FREQUENCIES } from 'lib/calculator/constants/other-expenses'
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
          <Button type="primary" onClick={onClickAddExpense} icon={<PlusOutlined />} style={{ paddingRight: '4em', paddingLeft: '4em' }}>
            Add labor
          </Button>
        )}
      </SectionContainer>
      <Typography.Title level={5}>
        Use this section to quantify labor impacts from changing operations. For example, estimate time / cost saved by procurement staff and janitorial staff from moving materials off the floor to
        necessary bins or enclosures. Also, estimate additional staff hours needed to support washing needs.
      </Typography.Title>
      <Divider />
      {data?.laborCosts?.length ? (
        data.laborCosts.map(labor => (
          <InfoRow key={labor.id}>
            <Col span={16}>
              <Subtitle>{labor.description}</Subtitle>
              <Popconfirm title="Are you sure to delete this item?" onConfirm={() => onConfirmDelete(labor.id)} okText="Yes" cancelText="No">
                <a href="#">Delete</a>
              </Popconfirm>
            </Col>
            <Col span={8}>
              <InfoCard theme="forecast">
                <Typography.Title level={5}>Forecast</Typography.Title>
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
              </InfoCard>
            </Col>
          </InfoRow>
        ))
      ) : (
        <AddBlock>
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />} type="primary" style={{ paddingRight: '4em', paddingLeft: '4em' }}>
            Add labor
          </Button>
          <Placeholder>You have no labor entries yet. Click &apos;+ Add labor&apos; above to get started.</Placeholder>
        </AddBlock>
      )}
      <Drawer title="Add labor" onClose={onCloseDrawer} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <LaborFormDrawer onClose={onSubmit} />
      </Drawer>
    </Container>
  )
}

export default LaborSection
