import { Col, message, Popconfirm, Row, Typography } from 'antd'
import { ReusableLineItem } from 'lib/inventory/types/projects'
import { FC } from 'react'
import { DELETE } from 'lib/http'
import { InfoRow as StyledInfoRow } from '../../styles'
import InitialCosts from './InitialCosts'
import Forecast from './Forecast'

interface Props {
  item: ReusableLineItem
  onDelete(): void
  onEdit: (item: ReusableLineItem) => void
}

interface deleteResponse {
  lineItem: ReusableLineItem
}

const ItemRow: FC<Props> = ({ item, onEdit, onDelete }) => {
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
    <StyledInfoRow>
      <Col span={8}>
        <Typography.Title level={5}>{item.productName}</Typography.Title>
        <a
          href="#"
          onClick={e => {
            onEdit(item)
            e.preventDefault()
          }}
        >
          Edit
        </a>
        <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
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
    </StyledInfoRow>
  )
}

export default ItemRow
