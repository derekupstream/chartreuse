import prisma from 'lib/prisma';
import { duplicateProject } from 'lib/projects/duplicateProject';

const sourceProjectIds = ['f70e5ecc-7a28-474b-ab82-4b8e430db6a6', 'b5e3b84d-9c24-4784-b97f-290270948e25', 'a3bba2e5-3881-4f29-8de4-c7c45be3f1f9'];

const targetOrgId = '79cb54a3-8b75-4841-93d4-a23fd1c07553';

async function query() {
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: targetOrgId
    }
  });
  console.log('importing to org:', org.name)
  for (let i = 0; i < sourceProjectIds.length; i++) {
    const id = sourceProjectIds[i];
    const newProject = await duplicateProject({
      id,
      targetOrgId: targetOrgId,
      skipCopySuffix: true
    });
    console.log("imported project:", newProject.name, "(", id, ")");
  }
  console.log('done');
}

query();
