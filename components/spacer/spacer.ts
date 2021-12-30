import styled from 'styled-components'

interface Props {
  horizontal?: number
  vertical?: number
}

const Spacer = styled.div<Props>`
  height: ${p => p.vertical ?? 1}px;
  width: ${p => p.horizontal}px;
`

export default Spacer
