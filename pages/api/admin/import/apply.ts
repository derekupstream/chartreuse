import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';
import type { ColumnMapping } from './classify';

type ApplyRequest = {
  dataType: string;
  mappings: ColumnMapping[];
  rows: string[][];
  headers: string[];
  targetProjectId?: string;
  sessionId?: string;
};

function mapRow(row: string[], headers: string[], mappings: ColumnMapping[]): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((header, i) => {
    const mapping = mappings.find(m => m.sourceColumn === header);
    if (mapping?.targetField) {
      result[mapping.targetField] = row[i] ?? '';
    }
  });
  return result;
}

function toInt(v: string | undefined): number {
  const n = parseInt(v ?? '', 10);
  return isNaN(n) ? 0 : n;
}

function toFloat(v: string | undefined): number {
  const n = parseFloat(v ?? '');
  return isNaN(n) ? 0 : n;
}

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { dataType, mappings, rows, headers, targetProjectId, sessionId } = req.body as ApplyRequest;

  if (!dataType || !mappings || !rows || !headers) {
    return res.status(400).json({ error: 'dataType, mappings, rows, and headers are required' });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  if (dataType === 'single-use-products') {
    if (!targetProjectId) return res.status(400).json({ error: 'targetProjectId required for product imports' });
    for (let i = 0; i < rows.length; i++) {
      const mapped = mapRow(rows[i], headers, mappings);
      try {
        await prisma.singleUseLineItem.create({
          data: {
            projectId: targetProjectId,
            productId: mapped.productId || 'imported',
            caseCost: toFloat(mapped.caseCost),
            casesPurchased: toInt(mapped.casesPurchased),
            newCaseCost: toFloat(mapped.newCaseCost || mapped.caseCost),
            newCasesPurchased: toInt(mapped.newCasesPurchased || mapped.casesPurchased),
            unitsPerCase: toInt(mapped.unitsPerCase) || 1,
            frequency: mapped.frequency || 'Annually'
          }
        });
        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skipped++;
      }
    }
  } else if (dataType === 'reusable-products') {
    if (!targetProjectId) return res.status(400).json({ error: 'targetProjectId required for product imports' });
    for (let i = 0; i < rows.length; i++) {
      const mapped = mapRow(rows[i], headers, mappings);
      try {
        await prisma.reusableLineItem.create({
          data: {
            projectId: targetProjectId,
            productId: mapped.productId || null,
            productName: mapped.productName || null,
            caseCost: toFloat(mapped.caseCost),
            casesPurchased: toInt(mapped.casesPurchased),
            unitsPerCase: toInt(mapped.unitsPerCase) || 1,
            annualRepurchasePercentage: toFloat(mapped.annualRepurchasePercentage) || 0.1
          }
        });
        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skipped++;
      }
    }
  } else if (dataType === 'project-data') {
    const org = await prisma.org.findFirst({ where: { isUpstream: true }, select: { id: true } });
    if (!org) return res.status(500).json({ error: 'No upstream org found' });
    const defaultAccount = await prisma.account.findFirst({ where: { orgId: org.id }, select: { id: true } });
    if (!defaultAccount) return res.status(500).json({ error: 'No account found for upstream org' });

    for (let i = 0; i < rows.length; i++) {
      const mapped = mapRow(rows[i], headers, mappings);
      try {
        await prisma.project.create({
          data: {
            orgId: org.id,
            accountId: defaultAccount.id,
            name: mapped.name || `Imported project ${i + 1}`,
            USState: mapped.state || null,
            eventGuestCount: toInt(mapped.eventGuestCount)
          }
        });
        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skipped++;
      }
    }
  } else if (dataType === 'golden-dataset') {
    for (let i = 0; i < rows.length; i++) {
      const mapped = mapRow(rows[i], headers, mappings);
      try {
        await prisma.goldenDataset.create({
          data: {
            name: mapped.name || `Imported dataset ${i + 1}`,
            category: mapped.category || 'imported',
            inputs: mapped as any,
            expectedOutputs: {},
            tolerance: toFloat(mapped.tolerance) || 0.02
          }
        });
        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skipped++;
      }
    }
  } else {
    return res.status(400).json({ error: `Unsupported dataType: ${dataType}` });
  }

  // Update session record if provided
  if (sessionId) {
    await prisma.importSession
      .update({
        where: { id: sessionId },
        data: {
          importedRows: created,
          skippedRows: skipped,
          errors: errors as any,
          status: 'imported'
        }
      })
      .catch(() => {}); // Don't fail the import if session update fails
  }

  res.json({ created, skipped, errors: errors.slice(0, 10) });
});
