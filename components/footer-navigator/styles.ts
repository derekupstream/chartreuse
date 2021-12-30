import styled from 'styled-components'

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: end;
`

export const LinkBox = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 18px;
  justify-content: space-between;
  align-items: baseline;

  span {
    font-size: 16px;
    line-height: 30px;
    color: #8c8c8c;
  }

  a {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: #595959;
    transition: color 300ms;

    :hover {
      color: #2bbe50;
    }
  }
`

export const Container = styled.div`
  position: relative;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 80px;
  background-color: #ffffff;
  box-shadow: 0px -2px 8px rgba(0, 0, 0, 0.05);
  padding: 0 24px;
  border-radius: 8px;
`
