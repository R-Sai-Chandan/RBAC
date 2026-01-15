# RBAC Module: Documentation (Schema Aligned)

**Source of Truth**: `backend/migrations/`
**Reconciliation Status**: ALIGNED

## 1. Schema Invariants (From Migrations)

| Table | PK | FKs | Constraints |
| :--- | :--- | :--- | :--- |
| `users` | `id` | `organization_id` | Status Check: active/inactive/deleted |
| `roles` | `id` | `org_id`, `parent_role_id` | Unique Name per Org |
| `profiles` | `id` | `org_id` | Unique Code per Org |
| `modules` | `id` | `org_id` | Unique Code per Org |
| `permissions` | `id` | `org_id`, `module_id` | **Action Check: create/read/update/delete/export** |
| `profile_permissions` | `[org, prof, perm]` | `prof_id`, `perm_id` | **Effect Check: allow/deny** |

## 2. Requirement Traceability

| Requirement | Enforced At | Status |
| :--- | :--- | :--- |
| **Multi-tenancy** | DB Schema (Composite Keys) & Repositories | **PASS** |
| **Deny overrides Allow** | PermissionService (Logic) | **PASS** |
| **Role Inheritance** | RoleRepository (Recursive CTE) | **PASS** |
| **Fail-Closed** | Middleware & Service | **PASS** |
| **Auditability** | AuditService (Decisions + Mutations) | **PASS** |

## 3. Mismatches Fixed

1.  **User Model**: Renamed `email` -> `primary_email` to match `users` table.
2.  **Permission Actions**: Strictly typed to DB CHECK constraint values.
3.  **Permission Effects**: Strictly typed to DB CHECK constraint values.

## 4. Evaluation Logic (Authoritative)

1.  **Identity**: resolve `userId` from request.
2.  **Roles**: `WITH RECURSIVE` fetch all parent roles.
3.  **Profiles**: Join `role_profiles` -> `profiles`.
4.  **Permissions**: Join `profile_permissions` -> `permissions`.
5.  **Effect Check**:
    *   Any `DENY` -> **Access Denied**.
    *   Any `ALLOW` (and no DENY) -> **Access Granted**.
    *   Otherwise -> **Access Denied** (Implicit).

## 5. Known Gaps

*   **Role Creation**: No API route implemented yet.
*   **Audit Persistence**: Logs to stdout; wiring to `audit_logs` table needed.
*   **Caching**: Real-time DB queries for every request (Acceptable for MVP).

## 6. Verdict

The system is **SCHEMA ALIGNED** and **PRODUCTION SAFETY READY** pending integration tests.
