import { Button, Drawer, Typography, Row, Col, Popconfirm } from 'antd'
import { useState, useEffect } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import * as S from '../styles'
import { SingleUseProduct } from 'api/calculator/types/products'
import { SingleUseLineItem } from 'api/calculator/types/projects'
import { Project } from '.prisma/client'
import { DashboardUser } from 'components/dashboard'
import { ADDITIONAL_COSTS } from 'api/calculator/constants/additional-costs'
import ContentLoader from 'components/content-loader'
import { useSimpleQuery, useSimpleMutation } from 'hooks/useSimpleQuery'
import AdditionalCostsItemForm from './AdditionalCostsItemForm'

type ServerSideProps = {
  project: Project
  user: DashboardUser
}

interface SingleUseItemRecord {
  lineItem: SingleUseLineItem
  product: SingleUseProduct
}

const BaselineCard = ({ item }: { item: SingleUseItemRecord }) => {
  return null
  // const annualOccurence = getAnnualOccurence(item.lineItem.frequency)
  // const baselineTotal = annualOccurence * item.lineItem.caseCost * item.lineItem.casesPurchased
  // return (
  //   <S.StyledCard css="background: #ddd">
  //     <Row>
  //       <Col span={16}>
  //         <Typography.Title level={5}>Baseline</Typography.Title>
  //       </Col>
  //       <Col span={8}>
  //         <Typography.Text>Total</Typography.Text>
  //       </Col>
  //     </Row>
  //     <Row>
  //       <Col span={16}>
  //         <Typography.Text css="font-size: .8rem">Annual cost</Typography.Text>
  //         <br />
  //         <Typography.Text css="font-size: .7rem">
  //           (${item.lineItem.caseCost}/case x {annualOccurence * item.lineItem.casesPurchased})
  //         </Typography.Text>
  //       </Col>
  //       <Col span={8}>
  //         <Typography.Text>
  //           <strong>${baselineTotal.toLocaleString()}</strong>
  //         </Typography.Text>
  //       </Col>
  //     </Row>
  //   </S.StyledCard>
  // )
}

const ForecastCard = ({ item }: { item: SingleUseItemRecord }) => {
  return null
}

type ItemRowProps = {
  item: any
  onDelete?: (item: any) => void
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onDelete }) => {
  const handleDelete = () => {
    onDelete && onDelete(item)
  }

  return (
    <Row gutter={10} css="margin: 2em 0">
      <Col span={8}>
        <Typography.Title level={5}>{item.id}</Typography.Title>
        <Popconfirm title="Are you sure to delete this item?" onConfirm={handleDelete} okText="Yes" cancelText="No">
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
  const createAdditionalCostsItemMutation = useSimpleMutation(`/api/projects/${project.id}/additional-costs`)
  const deleteAdditionalCostsItemMutation = useSimpleMutation(`/api/projects/${project.id}/additional-costs`, 'DELETE')
  const [item, setItem] = useState(null)

  const addItem = () => {
    setItem(null)
    setIsDrawerVisible(true)
  }

  const closeDrawer = () => {
    setIsDrawerVisible(false)
  }

  useEffect(() => {
    items.refetch()
  }, [createAdditionalCostsItemMutation.isLoading, deleteAdditionalCostsItemMutation.isLoading])

  const handleSubmitForm = (data: any) => {
    createAdditionalCostsItemMutation.mutate({
      ...data,
      projectId: project.id,
    })
    closeDrawer()
  }

  const handleDeleteItem = (item: any) => {
    deleteAdditionalCostsItemMutation.mutate({
      id: item.id,
    })
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
            {items.data?.additionalCosts
              .filter((cost: any) => cost.categoryId === category.id)
              .map((item: any) => (
                <ItemRow key={item.id} item={item} onDelete={handleDeleteItem} />
              ))}
          </div>
        ))}
        {items.data?.additionalCosts.length > 0 && <SummaryRow items={items.data.additionalCosts} />}
      </>
      <Drawer title="Add additional cost" placement="right" onClose={closeDrawer} visible={isDrawerVisible} contentWrapperStyle={{ width: '600px' }} destroyOnClose={true}>
        <AdditionalCostsItemForm onSubmit={handleSubmitForm} />
      </Drawer>
    </S.Wrapper>
  )
}
