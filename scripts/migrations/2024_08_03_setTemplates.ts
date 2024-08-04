import prisma from 'lib/prisma';

// const sourceProjectIds = ['f70e5ecc-7a28-474b-ab82-4b8e430db6a6', 'b5e3b84d-9c24-4784-b97f-290270948e25', 'a3bba2e5-3881-4f29-8de4-c7c45be3f1f9'];

// pepsi templates
const fields = {
  '9ebf0e8b-c7e2-4f3f-a45b-66100d661413': {
    isTemplate: true,
    templateDescription: '- 150 customers a day\n- Using dishwasher\n- Mostly take-out',
    name: 'Cafe / Cafeteria'
  },
  '36644747-6a76-43ef-ae66-f42fbd70e98d': {
    isTemplate: true,
    templateDescription: '- 150 customers a day\n- Mostly take-out',
    name: 'Fast Casual'
  },
  '8a779700-aeb7-48c9-b5af-4861578cca21': {
    isTemplate: true,
    templateDescription: '- 400 customers a day\n- Using dishwasher & hand-washing\n- Mostly take-out',
    name: 'Elementary School'
  }
};

// existing templates:
// 36644747-6a76-43ef-ae66-f42fbd70e98d Fast Casual
// 9f91f5f1-2450-43ed-b1b4-a93695178bd8 Cafe / Cafeteria
// af2ed786-7e8c-4e77-8e19-45e204f690e8 Elementary School
// const upstreamOrgId = '79cb54a3-8b75-4841-93d4-a23fd1c07553';

async function query() {
  const sourceProjectIds = Object.keys(fields);
  // make sure projects exist
  const projects = await prisma.project.findMany({
    where: {
      id: {
        in: sourceProjectIds
      }
    }
  });
  if (projects.length !== sourceProjectIds.length) {
    throw new Error('not all projects exist');
  }
  const templates = await prisma.project.findMany({
    where: {
      isTemplate: true
    }
  });
  console.log('existing templates:\n\n', templates.map(template => template.id + ' ' + template.name + '\n').join(''));
  await prisma.project.updateMany({
    where: {
      isTemplate: true
    },
    data: {
      isTemplate: false
    }
  });
  console.log('Assigning templates:', sourceProjectIds.map(id => id + '\n').join(''));
  for (let i = 0; i < sourceProjectIds.length; i++) {
    const id = sourceProjectIds[i];
    const result = await prisma.project.update({
      where: {
        id: id
      },
      data: {
        // @ts-ignore
        ...(fields[id] as any),
        updatedAt: new Date()
      }
    });
    console.log('updated project:', result.name, '(', id, ')');
  }

  console.log('done');
}

query();
