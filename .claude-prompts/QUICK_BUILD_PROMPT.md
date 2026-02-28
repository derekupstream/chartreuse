# Quick Build Prompt - Missing Governance Components

## Immediate Action Required

Build the two missing components to complete the industry-standard analytics architecture:

### 1. Factor Dependencies Page
**File**: `pages/admin/data-science/dependencies/index.tsx`

**Core Features**:
- Interactive dependency graph (use D3.js)
- Factor search and filtering
- Impact analysis for changes
- "What if" scenario testing
- Circular dependency detection

**Product Manager Tools**:
- Risk assessment dashboard
- Dependency summary statistics
- Export reports for compliance

**Data Scientist Tools**:
- Detailed factor relationship editing
- Calculation path visualization
- Bulk dependency management
- Data quality validation

### 2. Data Lineage Page  
**File**: `pages/admin/data-science/lineage/index.tsx`

**Core Features**:
- End-to-end lineage from source to metric
- Time-based change tracking
- Interactive flow visualization
- Compliance report generation

**Product Manager Tools**:
- Compliance dashboard
- Source verification status
- Executive summary generation
- Regulatory compliance mapping

**Data Scientist Tools**:
- Detailed lineage exploration
- Change impact analysis
- Source data verification
- Calculation path debugging

## Technical Requirements

### Database Models (Already Exist)
```typescript
FactorDependency {
  id, factorId, dependsOnId, calculationPath, strength
}

FactorVersion {
  id, factorId, value, changedBy, changeReason, status
}

Factor {
  id, name, calculatorConstantKey, currentValue, unit, categoryId, sourceId
}
```

### API Endpoints to Create
```typescript
// Dependencies
GET /api/admin/dependencies
GET /api/admin/factors/:id/dependencies  
GET /api/admin/factors/:id/impact
POST /api/admin/dependencies

// Lineage
GET /api/admin/lineage/metrics/:metricId
GET /api/admin/lineage/factor/:factorId
GET /api/admin/lineage/history/:dateRange
POST /api/admin/lineage/export
```

### UI Requirements
- Use Ant Design (consistent with existing UI)
- Follow AdminLayout pattern
- Include loading states and error handling
- Add proper TypeScript types
- Implement responsive design

### Visualization Libraries
```json
{
  "d3": "^7.8.5",           // For dependency graphs
  "react-flow-renderer": "^11.10.4", // For lineage flows
  "recharts": "^2.8.0"      // For impact charts
}
```

## Success Criteria

### Must Have for Statement to Be True:
- [ ] Interactive dependency graph renders
- [ ] Impact analysis predicts change effects  
- [ ] Lineage tracking shows source-to-metric paths
- [ ] Compliance reports meet GHG Protocol
- [ ] Both user types can verify and modify data

### Performance Requirements:
- Graph renders with 100+ factors in < 3 seconds
- Lineage calculations complete in < 2 seconds
- Export generation works for large datasets
- Mobile responsive on tablets

### User Experience:
- Product manager assesses risks in < 5 minutes
- Data scientist traces any metric to source factors
- Zero training required for basic operations
- Export capabilities for external analysis

## Implementation Order

### Day 1-2: Dependencies Foundation
- Create basic dependencies page with factor list
- Implement simple D3.js dependency graph
- Add search and filter functionality

### Day 3-4: Dependencies Advanced  
- Add impact analysis and "what if" scenarios
- Implement circular dependency detection
- Add bulk operations for data scientists

### Day 5-6: Lineage Foundation
- Create lineage page with basic flow visualization
- Implement source-to-metric tracking
- Add time-based change history

### Day 7: Polish & Integration
- Add compliance reporting and export features
- Optimize performance and add caching
- User testing and bug fixes

## Key Files to Reference
- `pages/admin/data-science/change-requests/index.tsx` - Follow this UI pattern
- `pages/admin/data-science/constants/index.tsx` - Use similar data fetching
- `layouts/AdminLayout.tsx` - Add new menu items
- `lib/prisma.ts` - Database connection patterns

## Testing Requirements
- Test with 100+ factors in dependency graph
- Verify lineage calculation accuracy
- Test export functionality with real data
- Validate compliance report generation

Build these two pages and the analytics architecture statement will be completely true and verifiable by both product managers and data scientists!
