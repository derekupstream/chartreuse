import { Typography } from 'antd'
import Image from 'next/image'
import Logo from 'public/images/chart-reuse-logo-black.png'

export function PrintHeader({ accountName, orgName, projectName }: { accountName: string; orgName: string; projectName: string }) {
  return (
    <div className="print-only-flex" style={{ marginBottom: '10mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {projectName}{' '}
        <span style={{ fontWeight: 400 }}>
          | {accountName} | {orgName}
        </span>
      </Typography.Title>
      <Image src={Logo} width={230} height={60} alt="Chart Reuse" />
    </div>
  )
}
