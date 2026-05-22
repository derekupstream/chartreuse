import { ApartmentOutlined, TeamOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import type { SuggestedOrg } from 'pages/api/orgs/suggest';

type Mode = 'create' | 'join';

type Props = {
  suggestions: SuggestedOrg[];
  onChoose: (mode: Mode) => void;
};

export function ModePicker({ suggestions, onChoose }: Props) {
  const hasSuggestions = suggestions.length > 0;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
        How are you using Chart-Reuse today?
      </Typography.Title>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        <ModeCard
          icon={<ApartmentOutlined style={{ fontSize: 40, color: '#2bbe50' }} />}
          title='Create a new organization'
          description="You'll be the admin and can invite teammates."
          onClick={() => onChoose('create')}
        />
        <ModeCard
          icon={<TeamOutlined style={{ fontSize: 40, color: '#1677ff' }} />}
          title="Join my team's organization"
          description={
            hasSuggestions
              ? `We found ${suggestions.length} matching ${suggestions.length === 1 ? 'org' : 'orgs'} for your email.`
              : 'Use an invite code, or request to join.'
          }
          highlighted={hasSuggestions}
          onClick={() => onChoose('join')}
        />
      </div>
    </div>
  );
}

type ModeCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
  onClick: () => void;
};

function ModeCard({ icon, title, description, highlighted, onClick }: ModeCardProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      style={{
        padding: '32px 24px',
        border: `2px solid ${highlighted ? '#1677ff' : '#d9d9d9'}`,
        borderRadius: 8,
        background: highlighted ? '#e6f4ff' : '#fff',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 150ms',
        fontFamily: 'inherit'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = highlighted ? '#1677ff' : '#2bbe50';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = highlighted ? '#1677ff' : '#d9d9d9';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
        {title}
      </Typography.Title>
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {description}
      </Typography.Text>
    </button>
  );
}
