import styled from 'styled-components'

type Props = {
  title: String
  value: string
}

export const FooterData: React.FC<Props> = props => {
  const { title, value } = props

  return (
    <FooterBox>
      <span>{title}</span>
      <span>{value}</span>
    </FooterBox>
  )
}

const FooterBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  border-bottom: 1px solid #c4c4c4;
`
