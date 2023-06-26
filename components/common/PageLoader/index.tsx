import type { SpinProps } from 'antd';
import { Spin } from 'antd';

import * as S from './styles';

export function PageLoader(props: SpinProps) {
  return (
    <S.Wrapper>
      <Spin {...props} />
    </S.Wrapper>
  );
}
