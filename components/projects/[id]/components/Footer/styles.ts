import Link from 'next/link';
import styled from 'styled-components';

export const LinkBox = styled(Link)`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  text-decoration: none;

  .footer-labels {
    display: flex;
    flex-direction: column;
  }

  .footer-label {
    font-size: 11px;
    line-height: 15px;
    color: #8c8c8c;
  }

  .page-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
    color: #595959;
    transition: color 300ms;
  }

  .anticon {
    font-size: 14px;
    color: #8c8c8c;
    transition: color 300ms;
  }

  &:hover .page-title,
  &:hover .anticon {
    color: #2bbe50;
  }
`;

export const Container = styled.div`
  position: relative;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: #ffffff;
  box-shadow: 0px -2px 8px rgba(0, 0, 0, 0.05);
  padding: 0 24px;

  @media (max-width: 767px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 56px;
    padding: 0 16px;
  }
`;
