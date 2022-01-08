import React from 'react'
import { Tag as AntdTag } from 'antd'
import { FallOutlined } from '@ant-design/icons'
import { RiseOutlined } from '@ant-design/icons'

const Tag: React.FC<{ rising?: boolean; flipColor?: boolean }> = props => {
  const { children, rising, flipColor } = props
  const color = (rising && !flipColor) || (!rising && flipColor) ? '#2bbe50' : 'red'
  return (
    <AntdTag icon={rising ? <RiseOutlined /> : <FallOutlined />} css="border-radius: 16px;" color={color}>
      {children}
    </AntdTag>
  )
}

export default Tag
