# RBAC Product Integration & Handover Plan

> **Standard Version**: 1.0.0
> **Scope**: Backend & Frontend Integration
> **Objective**: Enable seamless integration of new products into the existing RBAC ecosystem without compromising security or architectural integrity.

---

## 1. Product Registration in RBAC

To introduce a new product (e.g., `PRODUCT_CRM`, `PRODUCT_BILLING`), you must register it as a set of modules within the RBAC system. This defines *what* resources exist for permissioning.

### 1.1 Module Definition
**Location**: Database (`modules` table).  
**Action**: Insert new rows into the `modules` table.

| Field | Value Convention | Example |
| :--- | :--- | :--- |
| `code` | `UPPERCASE_SNAKE_CASE` | `CRM_LEADS` |
| `name` | Human Readable | `CRM Leads` |
| `description` | Brief purpose | `Manage sales leads` |
| `parent_module_id`| Grouping (Optional) | `CRM_ROOT` (if strictly hierarchical) |

### 1.2 Navigation Registration
**Location**: `backend/src/rbac/routes/me.routes.ts`  
**Responsibility**: The `GET /me/navigation` endpoint acts as the central registry for the frontend sidebar.

**Steps**:
1.  Define your product container:
    ```typescript
    const crmProduct = {
        code: 'PRODUCT_CRM',
        label: 'CRM',
        route: '/crm', // Root route for the product
        icon: 'briefcase', // Feather icon name
        isVisible: true,
        children: []
    };
    ```
2.  Define modules and their **Primary Read Permission**:
    ```typescript
    const crmModules = [
        { jsCode: 'CRM_LEADS', label: 'Leads', route: '/crm/leads', action: 'read' },
        { jsCode: 'CRM_DEALS', label: 'Deals', route: '/crm/deals', action: 'read' }
    ];
    ```
3.  Modify the evaluation loop to check permissions and push enabled modules into `crmProduct.children`.
4.  Push `crmProduct` to the final `modules` array *if* it has children.

---

## 2. Permission Model Design

Design permissions *before* writing code. The RBAC system is **fail-closed**. If a permission doesn't exist, access is denied.

### 2.1 Permission Naming Standard (MANDATORY)
Format: `MODULE_CODE:action`

| Action | Meaning | UI Mapping |
| :--- | :--- | :--- |
| `read` | View list/details | Page Access, "View" buttons |
| `create` | Create new records | "Create", "Add", "New" buttons |
| `update` | Modify existing records | "Edit", "Update" buttons |
| `delete` | Soft/Hard delete | "Delete", "Remove" buttons |
| `export` | Download data | "Export CSV", "Download" buttons |

### 2.2 Permissions Flow
1.  **Permissions** are defined in the DB.
2.  **Profiles** (e.g., "Sales Manager") bundle permissions with an `ALLOW` effect.
3.  **Roles** (e.g., "VP of Sales") are assigned a Profile.
4.  **Users** are assigned Roles.
5.  **EvaluationService** resolves:
    `User -> Roles -> Profile -> Permissions = GRANTED/DENIED`

---

## 3. Backend Integration (MANDATORY)

Your product backend must live under `/src/product-name/` (or similar isolation) and mount routes securely.

### 3.1 Routing
**Mount Point**: `src/index.ts` (or main app file).  
**Path**: `/product-name/**`

```typescript
// src/index.ts
import { createCrmRouter } from './crm/routes';
// authenticate middleware matches implicit session or explicit token
app.use('/crm', authenticate, createCrmRouter(dependencies));
```

### 3.2 Authorization
**Middleware**: `requirePermission`  
**Location**: `src/rbac/middleware/requirePermission.middleware.ts`

**Usage**:
Apply strictly at the router level for generic checks, or inside handlers for granular checks.

```typescript
// router.ts
// GATE at the door: User must have basic READ access to hit this API group
router.use(requirePermission(evaluationService, 'CRM_LEADS', 'read'));

// SPECIFIC routes
router.post('/', 
    requirePermission(evaluationService, 'CRM_LEADS', 'create'),
    async (req, res) => { ... }
);
```

### 3.3 Service Design
Services **MUST NOT** depend on `express.Request`. They must be pure.

**Signature Requirement**:
```typescript
// CORRECT
async createLead(organizationId: string, userId: string, data: LeadData): Promise<Lead>;

// INCORRECT
async createLead(req: Request): Promise<Lead>;
```

**Tenant Isolation**:
Always use `organizationId` in *every* database query (Repository layer).
```sql
SELECT * FROM leads WHERE id = $1 AND organization_id = $2;
```

### 3.4 Audit Logging
**Service**: `AuditService`
**Rule**: Every `create`, `update`, `delete` action must be audited.

```typescript
await auditService.log({
    organizationId,
    userId,
    action: 'CREATE',
    entity: 'CRM_LEAD',
    entityId: newLead.id,
    details: { name: newLead.name }
});
```

---

## 4. Frontend Integration (MANDATORY)

New products live under `/src/product-name/` in the frontend repo.

### 4.1 Navigation
Controlled entirely by `useNavigation`. Do not hardcode sidebar links.
If `GET /me/navigation` says you have access, the sidebar renders it.

### 4.2 Hooks Usage
Access `rbac/hooks` for all security context.

1.  **`useAuth()`**: To get current identity (userId, orgId).
2.  **`useNavigation()`**: To check if navigation is loaded (`isLoaded`) and get module metadata.
3.  **`usePermissions(moduleCode)`**: **MANDATORY** for every page.

### 4.3 Page-Level Gating
Every page component must start with an access check.

```typescript
export default function LeadsPage() {
    const { canRead, canCreate, isLoaded } = usePermissions('CRM_LEADS');

    // 1. Fail Closed during load
    if (!isLoaded) return <Loading />;

    // 2. Gate Page Access
    if (!canRead) return <AccessDenied />;

    // 3. Render
    return (
        <div>
           {/* 4. Gate Actions */}
           {canCreate && <Button>Create Lead</Button>}
           <Table />
        </div>
    );
}
```

### 4.4 Routing
Register routes in `App.tsx` (or similar).
Static routing is fine because `LeadsPage` gates itself.
```tsx
<Route path="/crm/leads" element={<LeadsPage />} />
```
*Note: If a user accesses a route directly without permission, they see the `<AccessDenied />` set in step 4.3.*

---

## 5. Default Landing & Cross-Product Behavior

### 5.1 Default Landing Page
Users have a `default_landing_page` preference.
**Validation**: When a user selects a landing page, the backend (`/me/preferences`) validates they have `read` permission to that module.
**Redirect**: The Login flow redirects to this path. Ensure your new product routes are legitimate targets.

### 5.2 Module Codes
Unique across the ENTIRE system.
-   Start with Product Prefix: `CRM_`, `BILLING_`.
-   Never reuse `USERS`, `ROLES` which are core RBAC.

---

## 6. Multi-Product Coexistence Rules

1.  **Shared Identity**: `req.user` is the single source of truth. Do not create "Product Users".
2.  **Shared Organisation**: Data is strictly siloed by `organizationId`.
3.  **No Cross-Talk**: Product A should not directly query Product B tables. Use internal APIs or Service interfaces if integration is needed.
4.  **Unified Audit**: All products write to the central `audit_logs` table.

---

## 7. Common Mistakes (Anti-Patterns)

❌ **Reading `req.headers` for Identity**: Never decode tokens in product code. Use `req.user`.
❌ **Frontend Auth Logic**: Never write `if (user.role === 'admin')`. Always use `canCreate` from `usePermissions`.
❌ **Implicit permissions**: "If they can create, they can read". **False**. Explicitly check both if needed (or rely on UI flow).
❌ **Skipping Audit**: "It's just a small update". **No**. Audit everything.
❌ **Hardcoded Sidebar**: Adding a `<Link>` manually to the sidebar. It MUST come from the `navigation` API.

---

## 8. Integration Checklist

### Backend
- [ ] Module registered in DB with unique code.
- [ ] Route handler created under `/product` mount.
- [ ] `authenticate` middleware applied to root router.
- [ ] `requirePermission` used on all routes.
- [ ] Service methods verify `organizationId`.
- [ ] `AuditService` called for all writes.

### Frontend
- [ ] Product container added to `me.routes.ts` (Navigation API).
- [ ] Page components implment `usePermissions('MODULE_CODE')`.
- [ ] `!isLoaded` creates a loading state (Fail Closed).
- [ ] Action buttons (Create/Edit) conditionally rendered.
- [ ] No hardcoded role checks exist.

### Verification
- [ ] **Login as unauthorized user**: Verify 403 on API and Access Denied on UI.
- [ ] **Login as authorized user**: Verify clean navigation and button visibility.
- [ ] **Direct URL Access**: Verify page self-gates if visited directly.
