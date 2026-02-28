# Claude Code Implementation Prompt

## Context
You need to complete the industry-standard analytics architecture for Chart-Reuse. We have the database schema and basic factor library, but need to implement the full governance and lineage systems to make this statement true:

"Chart-Reuse's analytics architecture combines practical validation with industry-standard governance. Our system uses golden dataset regression testing to ensure calculation accuracy, versioned factor libraries for EPA emission sources and utility rates, documented methodology for transparency, and full lineage tracking from constants to final metrics. This approach aligns with GHG Protocol transparency guidance, W3C PROV data provenance standards, DAMA data governance principles, and modern analytics engineering methodologies."

## Current State Analysis
- ✅ Database schema exists (Factor, FactorVersion, FactorDependency, ChangeRequest models)
- ✅ Basic factor library UI exists at `/admin/data-science/constants`
- ✅ Golden dataset testing exists
- ❌ No governance workflow UI
- ❌ No dependency visualization
- ❌ No lineage tracking
- ❌ No change request management

## Your Mission
Implement the missing pieces to achieve true industry-standard analytics governance. Focus on:

### 1. Change Request Management System
**Priority**: CRITICAL - This is the core governance workflow

**Build**: `pages/admin/data-science/change-requests/index.tsx`
- Full CRUD for change requests
- Approval workflow with status tracking
- Priority levels and assignment
- Integration with factor library
- Email notifications for approvals

**API**: Create endpoints in `pages/api/data-science/change-requests/`
- GET all requests with filtering
- POST new requests
- PUT for approvals/rejections
- Status tracking and history

### 2. Factor Dependency Visualization
**Priority**: HIGH - Essential for impact analysis

**Build**: `pages/admin/data-science/dependencies/index.tsx`
- Interactive dependency graph (use D3.js or vis.js)
- Factor impact analysis
- "What if" scenario testing
- Dependency search and filtering
- Circular dependency detection

**Features**:
- Visual graph with nodes and edges
- Click to explore factor details
- Highlight impact paths
- Export dependency reports

### 3. Data Lineage Tracking
**Priority**: HIGH - Required for compliance

**Build**: `pages/admin/data-science/lineage/index.tsx`
- End-to-end lineage from source factors to final metrics
- Time-based lineage showing changes over time
- Visual flow diagrams
- Compliance reporting exports

**Features**:
- Source → Factor → Calculation → Metric mapping
- Version history timeline
- Change impact visualization
- Audit trail generation

### 4. Integration & Enhancement
**Priority**: MEDIUM - Polish and connect

**Updates needed**:
- Add new menu items to `AdminLayout.tsx`
- Update factor library to show governance status
- Connect all systems with real-time updates
- Add compliance dashboards

## Technical Requirements

### Database Models (Already Exist)
```sql
-- These models are already in the schema, just need UI
ChangeRequest: id, type, factorId, proposedValue, reason, priority, status, reviewedBy, implementedAt
FactorDependency: id, factorId, dependsOnId, calculationPath, strength  
FactorVersion: id, factorId, value, changedBy, changeReason, status, approvedBy, approvedAt
```

### UI Framework
- Use existing Ant Design components
- Follow existing patterns from factor library
- Implement responsive design
- Add proper TypeScript types
- Include loading states and error handling

### API Standards
- Follow existing Next.js API patterns
- Use Prisma for database operations
- Implement proper error handling
- Add authentication middleware
- Include validation and sanitization

## Implementation Strategy

### Week 1: Foundation (Change Requests)
- Day 1-2: Build change request UI with list and forms
- Day 3-4: Create API endpoints for CRUD operations
- Day 5: Implement approval workflow and notifications

### Week 2: Visualization (Dependencies)
- Day 1-3: Build dependency graph with D3.js
- Day 4-5: Add impact analysis and "what if" scenarios

### Week 3: Lineage & Integration
- Day 1-3: Build lineage tracking with flow diagrams
- Day 4-5: Integrate all systems and add compliance reporting

## Success Criteria
The implementation is complete when:

1. **Governance Workflow**:
   - [ ] Users can submit change requests through UI
   - [ ] Approval process is end-to-end functional
   - [ ] Status tracking is accurate and real-time
   - [ ] Notifications work for all workflow steps

2. **Dependency Tracking**:
   - [ ] Factor dependencies are visualized interactively
   - [ ] Impact analysis shows change consequences
   - [ ] Circular dependencies are detected and flagged
   - [ ] "What if" scenarios work for planning

3. **Data Lineage**:
   - [ ] Complete lineage from source to metric is traceable
   - [ ] Time-based change tracking is accurate
   - [ ] Visual flow diagrams are clear and exportable
   - [ ] Compliance reports can be generated

4. **Industry Standards Compliance**:
   - [ ] GHG Protocol transparency requirements met
   - [ ] W3C PROV provenance standards followed
   - [ ] DAMA governance principles implemented
   - [ ] Analytics engineering best practices applied

## Key Files to Reference
- `prisma/schema.prisma` - Database models are already defined
- `pages/admin/data-science/constants/index.tsx` - Follow this pattern
- `layouts/AdminLayout.tsx` - Add menu items here
- `lib/middleware/` - Use existing auth patterns

## Testing Requirements
- Unit tests for all new components
- Integration tests for API endpoints
- E2E tests for governance workflows
- Performance tests for dependency graphs
- Compliance validation against standards

## Documentation
- Update how-to guide with new workflows
- Create governance process documentation
- Add API documentation for new endpoints
- Document compliance reporting features

Build this systematically and we'll have true industry-standard analytics governance that makes the statement completely accurate!
