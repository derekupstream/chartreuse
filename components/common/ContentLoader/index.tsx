import type { SpinProps } from 'antd';
import { Spin } from 'antd';

import * as S from './styles';

export default function Loader(props: SpinProps) {
  return (
    <S.Wrapper>
      <Spin {...props} size='large' />
    </S.Wrapper>
  );
}
