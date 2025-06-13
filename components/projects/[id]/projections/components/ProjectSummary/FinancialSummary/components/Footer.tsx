import type { ReactNode } from 'react';
import styled from 'styled-components';
type Props = {
  title: string;
  icon?: ReactNode;
  value: string | number;
};

const FooterBox = styled.div`
  padding: 8px 0;
  @media (min-width: 900px) {
    display: flex;
    padding-bottom: 0;
  }
  justify-content: space-between;
  align-items: center;
  min-height: 56px;
  border-bottom: 1px solid #c4c4c4;
`;

const Title = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
`;

export const FooterData: React.FC<Props> = props => {
  const { title, icon, value } = props;

  return (
    <FooterBox>
      <Title>
        {title}
        {icon && <span>{icon}</span>}
      </Title>
      <div>{value}</div>
    </FooterBox>
  );
};
