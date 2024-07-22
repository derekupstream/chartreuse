import { TEMPLATES } from '../projects/templates/config';

const DEV_PAGES = [
  {
    slug: 'yolo',
    orgName: 'YOLO',
    orgId: '73c6307a-a88c-44bf-bb40-5e72547055ac',
    title: 'YOLO!',
    templates: TEMPLATES.dev
  }
] as const;

const upstreamOrgId = '79cb54a3-8b75-4841-93d4-a23fd1c07553';

const PRODUCTION_PAGES = [
  {
    slug: 'onsite-dining',
    title: 'Onsite Dining',
    orgId: upstreamOrgId,
    templates: TEMPLATES.production
  }
] as const;

// for testing remotely
// export const pages = PRODUCTION_PAGES;
export const pages = process.env.NODE_ENV === 'production' ? PRODUCTION_PAGES : DEV_PAGES;
