import { Button, Col, Divider, Drawer, message, Popconfirm, Typography } from 'antd'
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery'
import { useState } from 'react'
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../expense-block'
import { SectionContainer, SectionData, SectionTitle } from '../styles'
import { InfoCard, InfoRow } from 'components/calculator/styles'

import { useRouter } from 'next/router'
import { OtherExpense } from '@prisma/client'
import { PlusOutlined } from '@ant-design/icons'
import { formatToDollar } from 'lib/calculator/utils'
import { OTHER_EXPENSES_FREQUENCIES } from 'lib/calculator/constants/other-expenses'
import OtherExpensesFormDrawer from './other-expenses-form-drawer'
import ContentLoader from 'components/content-loader'

type Response = {
  otherExpenses: OtherExpense[]
}

const OtherExpenseSection = () => {
  const route = useRouter()
  const projectId = route.query.id
  const url = `/api/other-expenses/?projectId=${projectId}`
  const { data, isLoading, refetch } = useSimpleQuery<Response>(url)
  const deleteOtherExpenses = useSimpleMutation(url, 'DELETE')

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  const onClickAddExpense = () => {
    setIsDrawerVisible(true)
  }

  const onCloseDrawer = () => {
    setIsDrawerVisible(false)
  }

  const onSubmit = () => {
    setIsDrawerVisible(false)
    message.success('Additional expense created')
    refetch()
  }

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id }

    deleteOtherExpenses.mutate(reqBody, {
      onSuccess: onSuccessDelete,
    })
  }

  const onSuccessDelete = () => {
    message.success('Additional expense deleted')
    refetch()
  }

  if (isLoading) {
    return <ContentLoader />
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Other cost impacts</SectionTitle>
        {!!data?.otherExpenses?.length && (
          <Button onClick={onClickAddExpense} icon={<PlusOutlined />} type="primary" style={{ paddingRight: '4em', paddingLeft: '4em' }}>
            Add cost impact
          </Button>
        )}
      </SectionContainer>
      <Divider />
      {data?.otherExpenses?.length ? (
        data.otherExpenses.map(additionalCost => (
          <InfoRow key={additionalCost.id}>
            <Col span={16}>
              <Subtitle>{additionalCost.description}</Subtitle>
              <Popconfirm title="Are you sure to delete this item?" onConfirm={() => onConfirmDelete(additionalCost.id)} okText="Yes" cancelText="No">
                <a href="#">Delete</a>
              </Popconfirm>
            </Col>
            <Col span={8}>
              <InfoCard theme="forecast">
                <Typography.Title level={5}>Forecast</Typography.Title>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <td>Frequency</td>
                      <td>Annual Total</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{additionalCost.frequency}</td>
                      <td>{formatToDollar(additionalCost.cost * getFrequencyInNumber(additionalCost.frequency))}</td>
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
            Add cost impact
          </Button>
          <Placeholder>You have no additional expense entries yet. Click &apos;+ Add cost impact&apos; above to get started.</Placeholder>
        </AddBlock>
      )}
      <Drawer title="Add cost impact" onClose={onCloseDrawer} visible={isDrawerVisible} contentWrapperStyle={contentWrapperStyle} destroyOnClose>
        <OtherExpensesFormDrawer onClose={onSubmit} />
      </Drawer>
    </Container>
  )
}

const getFrequencyInNumber = (name: string) => {
  return OTHER_EXPENSES_FREQUENCIES.find(freq => freq.name.toString() === name)?.annualOccurrence! || 1
}

export default OtherExpenseSection
