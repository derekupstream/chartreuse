import { GoogleOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { useAuth } from 'hooks/useAuth';

import * as S from './styles';

export function SignupForm() {
  const { signInWithGoogle } = useAuth();

  return (
    <S.Wrapper>
      <Button onClick={signInWithGoogle} type='default' block size='large' icon={<GoogleOutlined />}>
        Sign up with Google
      </Button>
    </S.Wrapper>
  );
}
