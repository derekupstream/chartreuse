import { Button, Drawer, Typography, Row, Col, Popconfirm, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import * as S from '../styles'
import { SingleUseProduct } from 'api/calculator/types/products'
import { SingleUseLineItem } from 'api/calculator/types/projects'
import { DELETE } from 'lib/http'
import { Project } from '.prisma/client'
import { DashboardUser } from 'components/dashboard'
import { ADDITIONAL_COSTS } from 'api/calculator/constants/additional-costs'
import ContentLoader from 'components/content-loader'
import { getAnnualOccurence } from 'api/calculator/constants/frequency'
import AdditionalCostsForm from './AdditionalCostsForm'
import useSimpleQuery from 'hooks/useSimpleQuery'

type ServerSideProps = {
  project: Project
  user: DashboardUser
}

interface SingleUseItemRecord {
  lineItem: SingleUseLineItem
  product: SingleUseProduct
}

const BaselineCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurence = getAnnualOccurence(item.lineItem.frequency)
  const baselineTotal = annualOccurence * item.lineItem.caseCost * item.lineItem.casesPurchased
  return (
    <S.StyledCard css="background: #ddd">
      <Row>
        <Col span={16}>
          <Typography.Title level={5}>Baseline</Typography.Title>
        </Col>
        <Col span={8}>
          <Typography.Text>Total</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={16}>
          <Typography.Text css="font-size: .8rem">Annual cost</Typography.Text>
          <br />
          <Typography.Text css="font-size: .7rem">
            (${item.lineItem.caseCost}/case x {annualOccurence * item.lineItem.casesPurchased})
          </Typography.Text>
        </Col>
        <Col span={8}>
          <Typography.Text>
            <strong>${baselineTotal.toLocaleString()}</strong>
          </Typography.Text>
        </Col>
      </Row>
    </S.StyledCard>
  )
}

const ForecastCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurence = getAnnualOccurence(item.lineItem.frequency)
  const baselineTotal = annualOccurence * item.lineItem.caseCost * item.lineItem.casesPurchased
  const forecastTotal = annualOccurence * item.lineItem.newCaseCost * item.lineItem.newCasesPurchased
  const change = forecastTotal - baselineTotal
  const isNegativeChange = change < 0
  return (
    <S.StyledCard css="background: #bbb">
      <Row>
        <Col span={10}>
          <Typography.Title level={5}>Forecast</Typography.Title>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Total</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Change</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={10}>
          <Typography.Text css="font-size: .8rem">Annual cost</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>${forecastTotal.toLocaleString()}</strong>
          </Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>
              {isNegativeChange ? '-' : '+'}${Math.abs(change).toLocaleString()}
            </strong>
          </Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Typography.Text css="font-size: .7rem">
            (${item.lineItem.newCaseCost}/case x {annualOccurence * item.lineItem.newCasesPurchased})
          </Typography.Text>
        </Col>
      </Row>
    </S.StyledCard>
  )
}

const ItemRow = ({ item, onDelete }: { item: SingleUseItemRecord; onDelete: () => void }) => {
  function confirm() {
    DELETE(`/api/projects/${item.lineItem.projectId}/single-use-items`, {
      id: item.lineItem.id,
    })
      .then(() => {
        message.success('Item removed')
        onDelete()
      })
      .catch(error => {
        if (error.error || error.message) {
          message.error(error.error || error.message)
        }
      })
  }

  return (
    <Row gutter={10} css="margin: 2em 0">
      <Col span={8}>
        <Typography.Title level={5}>{item.product.title}</Typography.Title>
        <Popconfirm title="Are you sure to delete this item?" onConfirm={confirm} okText="Yes" cancelText="No">
          <a href="#">Delete</a>
        </Popconfirm>
      </Col>
      <Col span={8}>
        <BaselineCard item={item} />
      </Col>
      <Col span={8}>
        <ForecastCard item={item} />
      </Col>
    </Row>
  )
}

type SummaryRowProps = {
  items: any[]
}

const SummaryRow = ({ items }: SummaryRowProps) => {
  // @todo
  return null
}

export default function AdditionalCosts({ project }: ServerSideProps) {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false)
  const items = useSimpleQuery(`/api/projects/${project.id}/additional-costs`)
  const [item, setItem] = useState(null)

  function addItem() {
    setItem(null)
    setIsDrawerVisible(true)
  }

  function closeDrawer() {
    setIsDrawerVisible(false)
  }

  function onSubmitNewItem() {
    closeDrawer()
    items.refetch()
  }

  if (items.isFetching) {
    return <ContentLoader />
  }

  return (
    <S.Wrapper>
      <Typography.Title level={2}>Additional expenses and savings</Typography.Title>
      <>
        <Typography.Title level={5}>
          You may incur additional expenses or savings when switching from single-use to reusable products. For example, dishwashing equiptment and labor, and modifications to your facilities. This
          section will help you accurately estimate addtional expenses.
        </Typography.Title>
        <div css="margin: 2em 0;">
          <Button type="primary" onClick={addItem} icon={<PlusOutlined />}>
            Add item
          </Button>
        </div>
        {ADDITIONAL_COSTS.map(category => (
          <div key={category.id}>
            <Typography.Title level={3}>{category.name}</Typography.Title>
            {items.data.additionalCosts
              .filter((cost: any) => cost.categoryId === category.id)
              .map((item: any) => (
                <ItemRow key={item.id} item={item} onDelete={items.refetch} />
              ))}
          </div>
        ))}
        {items.data.additionalCosts.length > 0 && <SummaryRow items={items.data.additionalCosts} />}
      </>
      <Drawer title="Add single-use item" placement="right" onClose={closeDrawer} visible={isDrawerVisible} contentWrapperStyle={{ width: '600px' }} destroyOnClose={true}>
        <AdditionalCostsForm item={item} projectId={project.id} onSubmit={onSubmitNewItem} />
      </Drawer>
    </S.Wrapper>
  )
}
