import styled from 'styled-components';

type Props = {
  title: string;
  value: string | number;
};

export const FooterData: React.FC<Props> = props => {
  const { title, value } = props;

  return (
    <FooterBox>
      <div>{title}</div>
      <div>{value}</div>
    </FooterBox>
  );
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
