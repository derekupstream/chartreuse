import Container from "components/container";
import Image from "next/image";
import Logo from "assets/images/logo.png";
import { Space, Typography } from "antd";
import LegalNotice from "components/legal-notice";
import * as S from "./styles";

const EmailVerificationPage: React.FC = () => {
  return (
    <Container>
      <S.Wrapper>
        <Image src={Logo} alt="upstream logo" />
        <Space direction="vertical">
          <Typography.Title>Got it!</Typography.Title>
          <Typography.Text strong>
            Check your email for a link to continue setting up your
            organization.
          </Typography.Text>
        </Space>
        <LegalNotice />
      </S.Wrapper>
    </Container>
  );
};

export default EmailVerificationPage;
