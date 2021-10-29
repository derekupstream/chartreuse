import { Col, message, Popconfirm, Row, Typography } from 'antd'
import { ReusableLineItem } from 'internal-api/calculator/types/projects'
import { FC } from 'hoist-non-react-statics/node_modules/@types/react'
import { DELETE } from 'lib/http'
import InitialCosts from './InitialCosts'
import Forecast from './Forecast'

interface Props {
  item: ReusableLineItem
  onDelete(): void
}

interface deleteResponse {
  lineItem: ReusableLineItem
}

const ItemRow: FC<Props> = ({ item, onDelete }) => {
  const onClickConfirm = async () => {
    const url = `/api/projects/${item.projectId}/reusable-items`
    try {
      const { lineItem } = await DELETE<deleteResponse>(url, { id: item.id })
      message.success(`Item "${lineItem.productName}" removed`)
      onDelete()
    } catch (error: any) {
      if (error.error || error.message) {
        message.error(error.error || error.message)
      }
    }
  }

  return (
    <Row gutter={10} css="margin: 2em 0">
      <Col span={8}>
        <Typography.Title level={5}>{item.productName}</Typography.Title>
        <Popconfirm title="Are you sure to delete this item?" onConfirm={onClickConfirm} okText="Yes" cancelText="No">
          <a href="#">Delete</a>
        </Popconfirm>
      </Col>
      <Col span={8}>
        <InitialCosts item={item} />
      </Col>
      <Col span={8}>
        <Forecast item={item} />
      </Col>
    </Row>
  )
}

export default ItemRow
