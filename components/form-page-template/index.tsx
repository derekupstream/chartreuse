import Container from "components/container";
import Image from "next/image";
import Logo from "public/images/chartreuse-logo-black.png";
import { Space, Typography } from "antd";
import LegalNotice from "components/legal-notice";

import * as S from "./styles";

type Props = {
  title: string;
  subtitle?: string;
  navBackLink?: React.ReactElement;
};

const FormPageTemplate: React.FC<Props> = ({
  children,
  title,
  subtitle,
  navBackLink,
}) => {
  return (
    <Container>
      <S.Wrapper>
        <Space direction="vertical" size={54} style={{ width: "100%" }}>
          {!navBackLink && (
            <Image src={Logo} width={300} height={70} alt="Chartreuse" />
          )}
          {navBackLink && (
            <S.LogoWithNavBackLink>
              {navBackLink}
              <Image src={Logo} alt="Chartreuse" />
              <div style={{ visibility: "hidden" }}>{navBackLink}</div>
            </S.LogoWithNavBackLink>
          )}
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
