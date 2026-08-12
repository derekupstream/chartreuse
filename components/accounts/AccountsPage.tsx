import { DeleteOutlined, EditOutlined, PlusOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Tooltip, Typography, Popconfirm, message, Input } from 'antd';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useMutation } from 'react-query';

import * as http from 'lib/http';
import type { LoggedinProps } from 'lib/middleware';
import chartreuseClient from 'lib/chartreuseClient';
import { RSP_IMPACT_FACTORS } from 'lib/rsp/impactFactors';
import type { AccountProductStat, AccountStats } from 'pages/accounts/index';

import * as S from '../../layouts/styles';

type AccountRow = {
  invitingPending: boolean;
  key: string;
  name: string;
  contact: string;
  stats?: AccountStats;
};

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const num = (n: number, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits });

/** Months of RSP data coverage, rounded to whole months with a floor of one. */
function serviceMonths(stats?: AccountStats): number {
  if (!stats?.serviceStart || !stats.serviceEnd) return 0;
  const days = (new Date(stats.serviceEnd).getTime() - new Date(stats.serviceStart).getTime()) / 86400000;
  return Math.max(1, Math.round(days / 30.44));
}

/** What the hover on a product pill explains: this account's flows plus the factors pricing them. */
function ProductPill({ product }: { product: AccountProductStat }) {
  const factors = RSP_IMPACT_FACTORS[product.type];
  const returnRate = product.outEvents > 0 ? Math.round((product.inEvents / product.outEvents) * 100) : null;
  return (
    <Tooltip
      title={
        <div style={{ fontSize: 12 }}>
          <b style={{ textTransform: 'capitalize' }}>{product.type}</b>
          <br />
          Sent out: {num(product.outEvents)} · Returned: {num(product.inEvents)}
          {returnRate !== null && <> · {returnRate}% return rate</>}
          <br />
          {factors ? (
            <>
              Per use: {factors.co2AvoidedKg} kg CO₂e · {factors.waterSavedGal} gal water · {factors.wasteDivertedLbs}{' '}
              lbs waste avoided
            </>
          ) : (
            <>Not in the product database — priced with generic fallback factors.</>
          )}
        </div>
      }
    >
      <Tag
        style={{ marginRight: 0, cursor: 'default', textTransform: 'capitalize' }}
        color={factors ? 'green' : 'default'}
      >
        {product.type}
      </Tag>
    </Tooltip>
  );
}

export function AccountsPage({
  user,
  org,
  accountStats = []
}: LoggedinProps & { org: { orgInviteCode: string | null }; accountStats?: AccountStats[] }) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(org.orgInviteCode);

  const updateInviteCode = useMutation((enabled: boolean) => chartreuseClient.updateOrgInviteCode(enabled), {
    onSuccess: data => {
      setInviteCode(data.orgInviteCode);
      message.success(data.orgInviteCode ? 'Invite link created' : 'Invite link deleted');
    },
    onError: (error: Error) => {
      message.error(error.message);
    }
  });

  const handleCreateInviteLink = useCallback(() => {
    updateInviteCode.mutate(true);
  }, [updateInviteCode]);

  const handleDeleteInviteLink = useCallback(() => {
    updateInviteCode.mutate(false);
  }, [updateInviteCode]);

  const inviteUrl = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`
    : '';

  const copyInviteLink = useCallback(() => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      message.success('Invite link copied to clipboard');
    }
  }, [inviteUrl]);

  function handleAccountDeletion(id: string) {
    return http
      .DELETE(`/api/account/${id}`)
      .then(() => {
        message.success(`Account deleted`);
        router.replace(router.asPath);
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  // Two views of the same table: accounts fed by an RSP integration get product/flow/impact
  // columns; orgs without any RSP data keep a simpler list. Projects, members and line items
  // moved to the account's detail page — they said nothing about health at a glance.
  const hasRspData = (accountStats ?? []).some(s => s.usagePeriodCount > 0);

  const nameColumn = {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record: AccountRow) => (
      <Space direction='vertical' size={0}>
        <span>{text}</span>
        {record.stats?.venueCategory && (
          <Tag style={{ fontSize: 10, marginTop: 2 }} color='geekblue'>
            {record.stats.venueCategory}
          </Tag>
        )}
      </Space>
    )
  };

  const contactColumn = {
    title: 'Contact',
    dataIndex: 'contact',
    key: 'contact',
    render: (text: string, record: AccountRow) => (
      <Space size='small'>
        {text}
        {record.invitingPending ? <Tag color='orange'>Pending</Tag> : <Tag color='blue'>Active</Tag>}
      </Space>
    )
  };

  const createdColumn = {
    title: 'Created',
    key: 'created',
    width: 110,
    render: (_: any, record: AccountRow) => (
      <Typography.Text type='secondary'>{formatDate(record.stats?.createdAt ?? null)}</Typography.Text>
    ),
    sorter: (a: AccountRow, b: AccountRow) =>
      (a.stats?.createdAt ? new Date(a.stats.createdAt).getTime() : 0) -
      (b.stats?.createdAt ? new Date(b.stats.createdAt).getTime() : 0)
  };

  const lastActivityColumn = {
    title: 'Last activity',
    key: 'lastActivity',
    width: 120,
    render: (_: any, record: AccountRow) => {
      const iso = record.stats?.lastActivity ?? null;
      if (!iso) return '—';
      return <Tooltip title={formatRelative(iso)}>{formatDate(iso)}</Tooltip>;
    },
    defaultSortOrder: 'descend' as const,
    sorter: (a: AccountRow, b: AccountRow) =>
      (a.stats?.lastActivity ? new Date(a.stats.lastActivity).getTime() : 0) -
      (b.stats?.lastActivity ? new Date(b.stats.lastActivity).getTime() : 0)
  };

  const rspColumns = [
    {
      title: 'Products',
      key: 'products',
      render: (_: any, record: AccountRow) => {
        const products = record.stats?.products ?? [];
        if (products.length === 0) return <Typography.Text type='secondary'>—</Typography.Text>;
        return (
          <Space size={[4, 4]} wrap>
            {products.map(product => (
              <ProductPill key={product.type} product={product} />
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Items out',
      key: 'outEvents',
      align: 'right' as const,
      width: 100,
      render: (_: any, record: AccountRow) => num(record.stats?.totals.outEvents ?? 0),
      sorter: (a: AccountRow, b: AccountRow) => (a.stats?.totals.outEvents ?? 0) - (b.stats?.totals.outEvents ?? 0)
    },
    {
      title: 'Items in',
      key: 'inEvents',
      align: 'right' as const,
      width: 100,
      render: (_: any, record: AccountRow) => num(record.stats?.totals.inEvents ?? 0),
      sorter: (a: AccountRow, b: AccountRow) => (a.stats?.totals.inEvents ?? 0) - (b.stats?.totals.inEvents ?? 0)
    },
    {
      title: 'Waste (lbs)',
      key: 'waste',
      align: 'right' as const,
      width: 110,
      render: (_: any, record: AccountRow) => num(record.stats?.totals.wasteDivertedLbs ?? 0),
      sorter: (a: AccountRow, b: AccountRow) =>
        (a.stats?.totals.wasteDivertedLbs ?? 0) - (b.stats?.totals.wasteDivertedLbs ?? 0)
    },
    {
      title: 'Water (gal)',
      key: 'water',
      align: 'right' as const,
      width: 110,
      render: (_: any, record: AccountRow) => num(record.stats?.totals.waterSavedGallons ?? 0),
      sorter: (a: AccountRow, b: AccountRow) =>
        (a.stats?.totals.waterSavedGallons ?? 0) - (b.stats?.totals.waterSavedGallons ?? 0)
    },
    {
      title: 'GHG (kg)',
      key: 'ghg',
      align: 'right' as const,
      width: 100,
      render: (_: any, record: AccountRow) => num(record.stats?.totals.co2AvoidedKg ?? 0, 1),
      sorter: (a: AccountRow, b: AccountRow) =>
        (a.stats?.totals.co2AvoidedKg ?? 0) - (b.stats?.totals.co2AvoidedKg ?? 0)
    },
    {
      title: 'Service',
      key: 'service',
      align: 'right' as const,
      width: 90,
      render: (_: any, record: AccountRow) => {
        const months = serviceMonths(record.stats);
        if (!months) return <Typography.Text type='secondary'>—</Typography.Text>;
        return (
          <Tooltip
            title={`${record.stats?.serviceStart} → ${record.stats?.serviceEnd} · ${record.stats?.usagePeriodCount} reporting period(s)`}
          >
            {months} mo
          </Tooltip>
        );
      },
      sorter: (a: AccountRow, b: AccountRow) => serviceMonths(a.stats) - serviceMonths(b.stats)
    }
  ];

  const columns = [
    nameColumn,
    contactColumn,
    ...(hasRspData ? rspColumns : []),
    createdColumn,
    lastActivityColumn,
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line react/display-name
      render: (_: any, record: AccountRow) => {
        return (
          <Space size='middle'>
            <Button onClick={() => router.push(`/accounts/edit/${record.key}`)} icon={<EditOutlined />} />
            <Popconfirm
              title={
                <Space direction='vertical' size='small'>
                  <Typography.Title level={4}>
                    Are you sure you want to delete the account &quot;
                    {record.name}&quot;?
                  </Typography.Title>
                  <Typography.Text>
                    You will lose any Account Admins, and Projects associated with {record.name}.
                  </Typography.Text>
                </Space>
              }
              onConfirm={() => handleAccountDeletion(record.key)}
            >
              <Button icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const statsById = new Map((accountStats ?? []).map(s => [s.id, s]));
  const data: AccountRow[] = user.org.accounts.map(account => ({
    key: account.id,
    name: account.name,
    contact: account.accountContactEmail,
    invitingPending: account.invites.some(i => i.email === account.accountContactEmail && !i.accepted),
    stats: statsById.get(account.id)
  }));

  const handleAddAcount = () => {
    router.push('/setup/account?dashboard=1');
  };

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <S.HeaderRow>
        <Typography.Title>Accounts</Typography.Title>
        {user.role === 'ORG_ADMIN' && (
          <Space size='middle' align='end'>
            <Button type='primary' onClick={handleAddAcount} icon={<PlusOutlined />}>
              Add account
            </Button>
            {!inviteCode ? (
              <Button onClick={handleCreateInviteLink} loading={updateInviteCode.isLoading} icon={<LinkOutlined />}>
                Generate invite link
              </Button>
            ) : (
              <Input.Group compact>
                <Button icon={<CopyOutlined />} onClick={copyInviteLink}>
                  Copy Invite Link
                </Button>
                <Popconfirm
                  title={
                    <Space direction='vertical' size='small'>
                      <Typography.Text>Are you sure you want to delete this invite link?</Typography.Text>
                      <Typography.Text type='secondary'>
                        The link will no longer work and users won't be able to sign up using it.
                      </Typography.Text>
                    </Space>
                  }
                  onConfirm={handleDeleteInviteLink}
                  okText='Delete'
                  cancelText='Cancel'
                  okButtonProps={{ danger: true }}
                >
                  <Button icon={<DeleteOutlined />} loading={updateInviteCode.isLoading} />
                </Popconfirm>
              </Input.Group>
            )}
          </Space>
        )}
        {user.role !== 'ORG_ADMIN' && (
          <Button type='primary' onClick={handleAddAcount} icon={<PlusOutlined />}>
            Add account
          </Button>
        )}
      </S.HeaderRow>
      {data.length > 0 && <Table columns={columns} dataSource={data} pagination={false} />}
      {data.length === 0 && (
        <Typography.Text>
          You have no active accounts in your organization. Click ‘+ Add account’ above to get started.
        </Typography.Text>
      )}
    </Space>
  );
}
