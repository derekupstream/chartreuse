import { Spin, SpinProps } from 'antd'
import * as S from './styles'

export default function PageLoader(props: SpinProps) {
  return (
    <S.Wrapper>
      <Spin {...props} />
    </S.Wrapper>
  )
}
