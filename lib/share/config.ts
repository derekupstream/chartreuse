const DEV_PAGES = [
  {
    slug: 'yolo',
    orgName: 'YOLO',
    title: 'YOLO!',
    data: [
      { slug: '1', project: 'Test' },
      { slug: '2', project: 'Test (Copy)' },
      { slug: '3', project: 'Test (Copy) (Copy)' }
    ]
  }
] as const;

const mattStagingId = '9bfcc839-ac34-4364-8e73-48212856da3b';
const upstreamId = '79cb54a3-8b75-4841-93d4-a23fd1c07553';

const PRODUCTION_PAGES = [
  {
    slug: 'upstream',
    orgId: upstreamId,
    title: 'Upstream',
    data: [
      { slug: 'small', project: 'Demonstration Project' },
      { slug: 'medium', project: 'Water savings test' },
      { slug: 'large', project: 'Large National Corporation' }
    ]
  },
  {
    slug: 'pepsi',
    title: 'Pepsi',
    orgId: upstreamId,
    data: [
      { slug: 'small', project: 'Small Restaurant (150 daily customers)' },
      { slug: 'medium', project: 'Mid-sized Restaurant (400 daily customers)' },
      { slug: 'large', project: 'Large Franchise Restaurant (600 daily customers)' }
    ]
  }
] as const;

// for testing remotely
export const pages = PRODUCTION_PAGES;
// export const pages = process.env.NODE_ENV === 'production' ? PRODUCTION_PAGES : DEV_PAGES;
