import { Typography } from 'antd';
import Link from 'next/link';

import * as S from './styles';

const LegalNotice = () => {
  return (
    <S.Wrapper>
      <Typography.Text type='secondary'>
        View our{' '}
        <Link href='/privacy-policy' legacyBehavior>
          <Typography.Link style={{ color: 'inherit' }} target='_blank' underline>
            Privacy Policy
          </Typography.Link>
        </Link>
      </Typography.Text>
      <br />
      <br />
      <br />
    </S.Wrapper>
  );
};

export default LegalNotice;
