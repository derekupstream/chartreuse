/**
 * Prisma Schema Registry — parses schema.prisma into structured model definitions.
 * Used by the Data Map graph explorer for zoom level 2 (table/schema view).
 *
 * SERVER-ONLY: This module uses fs/path. Client components should import
 * types from 'lib/admin/schemaTypes' instead.
 */

import fs from 'fs';
import path from 'path';

import type { SchemaField, SchemaModel, SchemaRegistry } from './schemaTypes';

export type { SchemaField, SchemaModel, SchemaRegistry };

// Set of Prisma scalar types (including db-specific)
const SCALAR_TYPES = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes']);

function parseField(line: string, modelNames: Set<string>): SchemaField | null {
  // Remove comments
  const commentIdx = line.indexOf('//');
  const clean = (commentIdx >= 0 ? line.slice(0, commentIdx) : line).trim();
  if (!clean || clean.startsWith('@@')) return null;

  // Match: fieldName  Type?[]  @attributes...
  const match = clean.match(/^(\w+)\s+(\w+)(\[\])?\??(\[\])?\s*(.*)?$/);
  if (!match) return null;

  const [, name, rawType, listBefore, listAfter, rest = ''] = match;
  const isList = !!listBefore || !!listAfter || clean.includes('[]');
  const isOptional = clean.includes('?');

  // Determine if it's a relation field
  const isRelation = !SCALAR_TYPES.has(rawType) && modelNames.has(rawType);

  const attributes: string[] = [];
  const attrMatches = Array.from(rest.matchAll(/@(\w+)/g));
  for (const m of attrMatches) {
    attributes.push(m[1]);
  }

  return {
    name,
    type: rawType,
    isList,
    isOptional,
    isRelation,
    relatedModel: isRelation ? rawType : undefined,
    isId: attributes.includes('id'),
    isUnique: attributes.includes('unique'),
    hasDefault: attributes.includes('default'),
    attributes
  };
}

let cached: SchemaRegistry | null = null;

export function getSchemaRegistry(): SchemaRegistry {
  if (cached) return cached;

  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const lines = content.split('\n');

  // First pass: collect all model and enum names
  const modelNames = new Set<string>();
  const enumNames: string[] = [];

  for (const line of lines) {
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) modelNames.add(modelMatch[1]);
    const enumMatch = line.match(/^enum\s+(\w+)\s*\{/);
    if (enumMatch) enumNames.push(enumMatch[1]);
  }

  // Second pass: parse models and their fields
  const models: SchemaModel[] = [];
  let currentModel: string | null = null;
  let currentFields: SchemaField[] = [];

  for (const line of lines) {
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      currentFields = [];
      continue;
    }

    if (currentModel && line.trim() === '}') {
      const scalarCount = currentFields.filter(f => !f.isRelation).length;
      const relationCount = currentFields.filter(f => f.isRelation).length;
      models.push({ name: currentModel, fields: currentFields, scalarCount, relationCount });
      currentModel = null;
      continue;
    }

    if (currentModel) {
      const field = parseField(line, modelNames);
      if (field) currentFields.push(field);
    }
  }

  cached = { models, enums: enumNames };
  return cached;
}

/**
 * Maps Data Map node IDs to Prisma model names.
 * Some nodes represent aggregations of multiple models.
 */
export const NODE_TO_MODELS: Record<string, string[]> = {
  projects: ['Project'],
  'rsp-api-keys': ['RspApiKey'],
  'import-sessions': ['ImportSession'],
  'single-use-items': ['SingleUseLineItem'],
  'reusable-items': ['ReusableLineItem'],
  'usage-time-periods': ['UsageTimePeriod'],
  'usage-period-products': ['UsagePeriodProduct'],
  milestones: ['ProjectMilestone'],
  factors: ['Factor'],
  'factor-versions': ['FactorVersion'],
  'calc-functions': [], // Not a DB model — from LINEAGE_MAP
  'compute-runs': ['ComputeRun'],
  'metric-results': ['MetricResult']
};

/** Reverse lookup: Prisma model name → Data Map node ID */
export const MODEL_TO_NODE: Record<string, string> = {};
for (const [nodeId, models] of Object.entries(NODE_TO_MODELS)) {
  for (const model of models) {
    MODEL_TO_NODE[model] = nodeId;
  }
}
