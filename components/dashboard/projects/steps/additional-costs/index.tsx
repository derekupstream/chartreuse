import { Button, Drawer, Typography, Row, Col, Popconfirm, message } from 'antd'
import { useState, useEffect } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import * as S from '../styles'
import { Project } from '.prisma/client'
import { ADDITIONAL_COSTS, ADDITIONAL_COST_FREQUENCIES } from 'internal-api/calculator/constants/additional-costs'
import ContentLoader from 'components/content-loader'
import { useSimpleQuery, useSimpleMutation } from 'hooks/useSimpleQuery'
import AdditionalCostsItemForm from './AdditionalCostsItemForm'

type ServerSideProps = {
  project: Project
}

type AdditionalCostItem = {
  id: string
  categoryId: string
  cost: number
  frequency: string
  projectId: string
}

type BaselineCardProps = {
  item: AdditionalCostItem
}

type ForecastCardProps = {
  item: AdditionalCostItem
}

const BaselineCard: React.FC<BaselineCardProps> = ({ item }) => {
  return null
}

const getHumanReadableFrequency = (annualOccurrence: string) => ADDITIONAL_COST_FREQUENCIES.find(i => i.annualOccurrence === parseInt(annualOccurrence))?.name

const ForecastCard: React.FC<ForecastCardProps> = ({ item }) => {
  const annualCost = Math.round(parseInt(item.frequency) * item.cost * 100) / 100
  const weeklyCost = Math.round((annualCost / 52) * 100) / 100

  return (
    <S.StyledCard css="background: #bbb">
      <Row>
        <Col span={24}>
          <Typography.Title level={5}>Forecast</Typography.Title>
        </Col>
      </Row>
      <Row>
        <Col span={10}>
          <Typography.Text css="font-size: .8rem">Frequency</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Weekly total</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Annual total</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={10}>
          <Typography.Text>
            <strong>{getHumanReadableFrequency(item.frequency)}</strong>
          </Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .7rem">${weeklyCost}</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .7rem">${annualCost}</Typography.Text>
        </Col>
      </Row>
      <Row></Row>
    </S.StyledCard>
  )
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
        <Typography.Title level={5}>{`${getHumanReadableFrequency(item.frequency)} expense`}</Typography.Title>
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

  const addItem = () => {
    setIsDrawerVisible(true)
  }

  const closeDrawer = () => {
    setIsDrawerVisible(false)
  }

  useEffect(() => {
    items.refetch()
  }, [items, createAdditionalCostsItemMutation.data, deleteAdditionalCostsItemMutation.data])

  const handleCreateAdditionalItemSuccess = () => {
    message.success('Additional cost added')
  }

  const handleCreateAdditionalItemError = () => {
    message.error('Unable to add additional cost')
  }

  const handleDeleteAdditionalItemSuccess = () => {
    message.success('Additional cost deleted')
  }

  const handleDeleteAdditionalItemError = () => {
    message.error('Unable to remove additional cost')
  }

  const handleSubmitForm = (data: any) => {
    createAdditionalCostsItemMutation.mutate(
      {
        ...data,
        projectId: project.id,
      },
      {
        onSuccess: handleCreateAdditionalItemSuccess,
        onError: handleCreateAdditionalItemError,
      }
    )
    closeDrawer()
  }

  const handleDeleteItem = (item: any) => {
    deleteAdditionalCostsItemMutation.mutate(
      {
        id: item.id,
      },
      {
        onSuccess: handleDeleteAdditionalItemSuccess,
        onError: handleDeleteAdditionalItemError,
      }
    )
  }

  if (items.isLoading) {
    return <ContentLoader />
  }

  return (
    <S.Wrapper>
      <Typography.Title level={2}>Additional expenses and savings</Typography.Title>
      <Typography.Title level={5}>
        You may incur additional expenses or savings when switching from single-use to reusable products. For example, dishwashing equiptment and labor, and modifications to your facilities. This
        section will help you accurately estimate addtional expenses.
      </Typography.Title>
      <div css="margin: 2em 0;">
        <Button type="primary" onClick={addItem} icon={<PlusOutlined />}>
          Add item
        </Button>
      </div>
      {ADDITIONAL_COSTS.map(category => {
        const filteredItems = items.data?.additionalCosts.filter((cost: any) => cost.categoryId === category.id)
        return filteredItems.length ? (
          <div key={category.id}>
            <Typography.Title level={3}>{category.name}</Typography.Title>
            {filteredItems.map((item: any) => (
              <ItemRow key={item.id} item={item} onDelete={handleDeleteItem} />
            ))}
          </div>
        ) : null
      })}
      {items.data?.additionalCosts.length > 0 && <SummaryRow items={items.data.additionalCosts} />}
      <Drawer title="Add additional cost" placement="right" onClose={closeDrawer} visible={isDrawerVisible} contentWrapperStyle={{ width: '600px' }} destroyOnClose={true}>
        <AdditionalCostsItemForm onSubmit={handleSubmitForm} />
      </Drawer>
    </S.Wrapper>
  )
}
