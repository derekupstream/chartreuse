type ProjectTemplate = {
  // createdAt: string;
  // createdBy: string;
  // orgId: string;
  projectId: string;
  imageUrl?: string;
  description?: string;
  slug: string; // used for public pages, can be derived by project title by default?
  title?: string;
};

// TODO: Save these in the DB. We will map the keys of this dict ("pepsi") to orgIds.
export const TEMPLATES: Record<string, ProjectTemplate[]> = {
  matt_dev: [
    { projectId: '2b657b6c-4be3-455b-998d-4587747c8876', slug: 'small' },
    { projectId: '040f3d56-9458-4e7f-84f8-7368de9f7fca', slug: 'medium' },
    { projectId: 'eb3019fe-a232-4b0f-ad11-ce817275ee16', slug: 'large' }
  ],
  pepsi: [
    // Upstream > Small Restaurant (150 daily customers)
    { projectId: '9ebf0e8b-c7e2-4f3f-a45b-66100d661413', slug: 'small' },
    // Upstream > Mid-sized Restaurant (400 daily customers)
    { projectId: '36644747-6a76-43ef-ae66-f42fbd70e98d', slug: 'medium' },
    // Upstream > Large Franchise Restaurant (600 daily customers)
    { projectId: '8a779700-aeb7-48c9-b5af-4861578cca21', slug: 'large' }
  ]
} as const;
