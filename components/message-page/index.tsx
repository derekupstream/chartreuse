import Container from "components/container";
import Image from "next/image";
import Logo from "assets/images/logo.png";
import { Space, Typography } from "antd";
import LegalNotice from "components/legal-notice";
import * as S from "./styles";

type Props = {
  title: string;
  message: string;
};

const MessagePage: React.FC<Props> = ({ title, message }) => {
  return (
    <Container>
      <S.Wrapper>
        <Image src={Logo} alt="upstream logo" />
        <Space direction="vertical">
          <Typography.Title>{title}</Typography.Title>
          <Typography.Text strong>{message}</Typography.Text>
        </Space>
        <LegalNotice />
      </S.Wrapper>
    </Container>
  );
};

export default MessagePage;
