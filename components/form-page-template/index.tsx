import Container from "components/container";
import Image from "next/image";
import Logo from "assets/images/logo.png";
import { Space, Typography } from "antd";
import * as S from "./styles";
import LegalNotice from "components/legal-notice";

type Props = {
  title: string;
  subtitle?: string;
};

const FormPageTemplate: React.FC<Props> = ({ children, title, subtitle }) => {
  return (
    <Container>
      <S.Wrapper>
        <Space direction="vertical" size={54}>
          <Image src={Logo} alt="upstream logo" />
          <Space direction="vertical">
            <Typography.Title>{title}</Typography.Title>
            <Typography.Text strong>{subtitle}</Typography.Text>
          </Space>
          <div>{children}</div>
          <LegalNotice />
        </Space>
      </S.Wrapper>
    </Container>
  );
};

export default FormPageTemplate;
