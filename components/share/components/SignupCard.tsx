import { EditOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import { Button } from 'antd';
import { useRouter } from 'next/router';
import styled from 'styled-components';

import { setSelectedTemplateCookie } from 'lib/cookies';
const GreenStyledCard = styled(Card)`
  background-color: #2bbe50;
  color: white;
  margin-bottom: 24px;
  .ant-card-body {
    align-items: center;
    display: flex;
  }
`;

export function SignupCard({
  templateParams
}: {
  templateParams: {
    projectId: string;
    slug: string;
  };
}) {
  const router = useRouter();
  function selectTemplate() {
    setSelectedTemplateCookie(templateParams);
    router.push('/signup');
  }

  return (
    <GreenStyledCard onClick={selectTemplate}>
      <div>
        <Button
          ghost
          icon={<EditOutlined />}
          size='large'
          style={{
            borderColor: 'white !important',
            color: 'white !important',
            cursor: 'pointer',
            flexGrow: 1,
            marginRight: 24
          }}
        >
          Start Project
        </Button>
      </div>
      <Typography.Paragraph style={{ color: 'white', margin: 0 }}>
        Chart your own switch to reuse by creating a free account, sign up now,{' '}
        <Typography
          style={{
            display: 'inline',
            cursor: 'pointer',
            color: 'white',
            textDecoration: 'underline',
            textUnderlineOffset: '2px'
          }}
        >
          sign up now
        </Typography>
      </Typography.Paragraph>
    </GreenStyledCard>
  );
}
