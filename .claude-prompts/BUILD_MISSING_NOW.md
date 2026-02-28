# URGENT: Build Missing Governance Components

## Current Status Check
I need you to build the two missing components for the industry-standard analytics architecture.

**Missing Files:**
- `pages/admin/data-science/dependencies/index.tsx` - Factor dependency visualization
- `pages/admin/data-science/lineage/index.tsx` - Data lineage tracking

**Missing API Endpoints:**
- `pages/api/admin/dependencies/index.ts` - Get all dependencies
- `pages/api/admin/lineage/metrics/[metricId].ts` - Get lineage for metric

## What to Build Right Now

### 1. Dependencies Page
**File**: `pages/admin/data-science/dependencies/index.tsx`

**Requirements:**
- Interactive dependency graph using D3.js or vis.js
- Show factors and their relationships
- Allow clicking on factors to see details
- Include search and filter functionality
- Show impact analysis when factors change

**API**: Create `pages/api/admin/dependencies/index.ts`
```typescript
// Return all factor dependencies
export default handlerWithUser().get(async (req, res) => {
  const dependencies = await prisma.factorDependency.findMany({
    include: {
      factor: { select: { id: true, name: true, currentValue: true, unit: true } },
      dependsOn: { select: { id: true, name: true, currentValue: true, unit: true } }
    }
  });
  res.json(dependencies);
});
```

### 2. Lineage Page  
**File**: `pages/admin/data-science/lineage/index.tsx`

**Requirements:**
- Show end-to-end lineage from source factors to metrics
- Use flow diagram visualization
- Include time-based change tracking
- Allow export for compliance reporting

**API**: Create `pages/api/admin/lineage/metrics/[metricId].ts`
```typescript
// Return lineage for specific metric
export default handlerWithUser().get(async (req, res) => {
  const { metricId } = req.query;
  // Build lineage from factors to this metric
  const lineage = await buildLineageForMetric(metricId);
  res.json(lineage);
});
```

## Database Models Available
```typescript
// These already exist in the database:
FactorDependency {
  id, factorId, dependsOnId, calculationPath, strength
}

Factor {
  id, name, calculatorConstantKey, currentValue, unit, categoryId, sourceId
}

FactorVersion {
  id, factorId, value, changedBy, changeReason, status, createdAt
}
```

## UI Requirements
- Use Ant Design components (consistent with existing UI)
- Follow AdminLayout pattern like other pages
- Include proper TypeScript types
- Add loading states and error handling
- Make it responsive

## Success Criteria
After building these, this statement will be TRUE:
"Chart-Reuse's analytics architecture combines practical validation with industry-standard governance. Our system uses golden dataset regression testing to ensure calculation accuracy, versioned factor libraries for EPA emission sources and utility rates, documented methodology for transparency, and full lineage tracking from constants to final metrics. This approach aligns with GHG Protocol transparency guidance, W3C PROV data provenance standards, DAMA data governance principles, and modern analytics engineering methodologies."

## Implementation Order
1. **First**: Create the dependencies page with basic graph
2. **Second**: Create the lineage page with flow visualization  
3. **Third**: Add the API endpoints
4. **Fourth**: Update AdminLayout to include new menu items

## Reference Existing Code
Follow the patterns from:
- `pages/admin/data-science/change-requests/index.tsx` - UI structure
- `pages/api/admin/factors/index.ts` - API patterns
- `layouts/AdminLayout.tsx` - Layout integration

Build these two pages and the analytics architecture statement will be completely true!
