import React from 'react'
import { Tag as AntdTag } from 'antd'
import { FallOutlined } from '@ant-design/icons'
import { RiseOutlined } from '@ant-design/icons'

const Tag: React.FC<{ rising?: boolean }> = props => {
  const { children, rising } = props

  return (
    <AntdTag icon={rising ? <RiseOutlined /> : <FallOutlined />} css="border-radius: 16px;" color={rising ? '#2BBE50' : 'red'}>
      {children}
    </AntdTag>
  )
}

export default Tag
