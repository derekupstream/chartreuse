import { Space, Typography } from 'antd';
import Image from 'next/legacy/image';

import Container from 'components/common/Container';
import LegalNotice from 'components/common/LegalNotice';
import Logo from 'public/images/chart-reuse-logo-black.png';

import * as S from './styles';

type Props = {
  title: string;
  message: string;
};

const MessagePage: React.FC<Props> = ({ title, message }) => {
  return (
    <Container>
      <S.Wrapper>
        <Image src={Logo} width={384} height={99} alt='Chart Reuse' />
        <Space direction='vertical'>
          <Typography.Title>{title}</Typography.Title>
          <Typography.Text strong>{message}</Typography.Text>
        </Space>
        <LegalNotice />
      </S.Wrapper>
    </Container>
  );
};

export default MessagePage;
