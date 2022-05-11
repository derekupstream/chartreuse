import { Typography } from 'antd'
import * as S from './styles'
import Link from 'next/link'

const LegalNotice = () => {
  return (
    <S.Wrapper>
      <Typography.Text type="secondary">
        View our{' '}
        <Link href="/privacy-policy" passHref>
          <Typography.Link style={{ color: 'inherit' }} target="_blank" underline>
            Privacy Policy
          </Typography.Link>
        </Link>
      </Typography.Text>
      <br />
      <br />
      <br />
    </S.Wrapper>
  )
}

export default LegalNotice
