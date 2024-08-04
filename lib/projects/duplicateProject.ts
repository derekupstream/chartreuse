import prisma from 'lib/prisma';

export async function duplicateProject({
  id: projectId,
  targetAccountId: _targetAccountId,
  targetOrgId: _targetOrgId,
  skipCopySuffix,
  skipTemplateProperties
}: {
  id: string;
  targetAccountId?: string;
  targetOrgId?: string;
  skipCopySuffix?: boolean;
  skipTemplateProperties?: boolean;
}) {
  // find the project to duplicate, do not include template fields
  const { createdAt, id, name, orgId, ...project } = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      otherExpenses: true,
      laborCosts: true,
      singleUseItems: {
        include: {
          records: true
        }
      },
      reusableItems: true,
      dishwashers: true,
      wasteHaulingCosts: true
    }
  });
  const targetAccountId = _targetAccountId || project.accountId;
  const targetOrgId = _targetOrgId || orgId;

  // create a new project with the same name and description
  const newProject = await prisma.project.create({
    data: {
      ...project,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: !project.isTemplate ? name + (skipCopySuffix ? '' : ' (Copy)') : '',
      accountId: targetAccountId,
      metadata: project.metadata as any,
      utilityRates: project.utilityRates as any,
      orgId: targetOrgId,
      // template properties
      isTemplate: skipTemplateProperties ? false : project.isTemplate,
      templateDescription: skipTemplateProperties ? null : project.templateDescription,
      templateId: project.isTemplate ? id : null,
      dishwashers: {
        createMany: {
          data: project.dishwashers.map(({ id, projectId, ...item }) => item)
        }
      },
      laborCosts: {
        createMany: {
          data: project.laborCosts.map(({ id, projectId, ...item }) => item)
        }
      },
      otherExpenses: {
        createMany: {
          data: project.otherExpenses.map(({ id, projectId, ...item }) => item)
        }
      },
      reusableItems: {
        createMany: {
          data: project.reusableItems.map(({ id, projectId, ...item }) => item)
        }
      },
      singleUseItems: {
        createMany: {
          data: project.singleUseItems.map(({ id, projectId, records, ...item }) => item)
        }
      },
      wasteHaulingCosts: {
        createMany: {
          data: project.wasteHaulingCosts.map(({ id, projectId, ...item }) => item)
        }
      }
    },
    include: {
      singleUseItems: true
    }
  });

  // create new records for the single use items
  await prisma.singleUseLineItemRecord.createMany({
    data: newProject.singleUseItems.flatMap(item => {
      const ogItem = project.singleUseItems.find(i => i.productId === item.productId);
      if (!ogItem) return [];
      return ogItem.records.map(record => ({
        ...record,
        singleUseItemId: item.id,
        projectId: newProject.id
      }));
    })
  });

  return newProject;
}
