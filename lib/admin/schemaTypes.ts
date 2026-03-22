/**
 * Shared types for the Prisma schema registry.
 * Separated from schemaRegistry.ts to allow client-side imports
 * without pulling in Node.js fs/path modules.
 */

export interface SchemaField {
  name: string;
  type: string;
  isList: boolean;
  isOptional: boolean;
  isRelation: boolean;
  relatedModel?: string;
  isId: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  attributes: string[];
}

export interface SchemaModel {
  name: string;
  fields: SchemaField[];
  /** Count of scalar (non-relation) fields */
  scalarCount: number;
  /** Count of relation fields */
  relationCount: number;
}

export interface SchemaRegistry {
  models: SchemaModel[];
  enums: string[];
}
