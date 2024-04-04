export const templates = [
  {
    slug: 'upstream',
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
    data: [
      { slug: 'small', project: 'Small Restaurant (150 daily customers)' },
      { slug: 'medium', project: 'Mid-sized Restaurant (400 daily customers)' },
      { slug: 'large', project: 'Large Franchise Restaurant (600 daily customers)' }
    ]
  }
] as const;
