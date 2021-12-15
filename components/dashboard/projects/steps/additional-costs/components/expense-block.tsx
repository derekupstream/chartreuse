import { ReactNode } from 'react'
import styled from 'styled-components'

export const contentWrapperStyle = { width: '600px' }

type Props = {
  sectionTitle: string
  sectionSubtitle?: string | React.ReactNode
  drawerTitle: string
  placeholder: string
  FormComponent: ReactNode
}

const ExpenseBlock: React.FC<Props> = props => {
  const { sectionTitle, sectionSubtitle, drawerTitle, placeholder, FormComponent } = props
  return null
}

export const Container = styled.div`
  margin-bottom: 36px;
`

export const Title = styled.p`
  font-size: 24px;
  line-height: 34px;
  font-weight: 800;
  color: #000;
  margin-bottom: 24px;
`

export const Subtitle = styled(Title)`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
`

export const Placeholder = styled(Subtitle)`
  color: #6b6b6b;
  margin-top: 24px;
`

export const AddBlock = styled.div`
  border: 1px dashed black;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 8px;
`

export default ExpenseBlock
