import React from 'react'
import { Tag as AntdTag } from 'antd'
import { FallOutlined } from '@ant-design/icons'
import { RiseOutlined } from '@ant-design/icons'

// the style is optimized for our case, which is that a positive number means a reduction in something, and is good (green)
const PercentTag: React.FC<{ value: number; rising?: boolean; flipColor?: boolean }> = props => {
  const { value } = props
  const rising = value < 0

  const color = rising ? 'red' : '#2bbe50'
  return (
    <AntdTag icon={rising ? <RiseOutlined /> : <FallOutlined />} style={{ borderRadius: '16px' }} color={color}>
      {value}%
    </AntdTag>
  )
}

export default PercentTag
