import styled from 'styled-components'

type Props = {
  borderTopColor: string
}

const ForecastCard = styled.div<Props>`
  border-top: 8px solid ${p => p.borderTopColor};
  background-color: white;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: normal;
  text-align: left;
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.08);
  thead {
    font-weight: normal;
  }
  tbody {
    font-weight: 700;
  }
  td {
    font-size: 11px;
    line-height: 16px;
    padding-right: 20px;
  }
`

export default ForecastCard
