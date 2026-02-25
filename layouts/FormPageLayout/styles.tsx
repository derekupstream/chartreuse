import styled from 'styled-components';

export const Wrapper = styled.div`
  text-align: center;
  padding-top: 4rem;

  h1 {
    margin-bottom: 0;
  }
`;

export const LogoWithNavBackLink = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;
