# RBAC System - Seed Data Execution Guide

## Quick Start

```bash
# 1. Ensure migrations are applied
cd backend
npx knex migrate:latest

# 2. Run seed data
npx knex seed:run

# 3. Verify successful seed
# Should see output:
# ✓ Organization created: Acme Corp
# ✓ Users created: 3
# ✓ Roles created: 3 (hierarchical)
# ... (complete summary)
```

## Seed Data Summary

### Organization
- **Acme Corp** (ID: 1, domain: acme.com)

### Users (Password: `Password@123` for all)
| Username | Email | Role | Landing Page |
|----------|-------|------|--------------|
| superadmin | superadmin@acme.com | SUPER_ADMIN | /rbac/admin/dashboard |
| admin | admin@acme.com | ADMIN | /rbac/admin/users |
| user | user@acme.com | USER | /rbac/profile |

### Roles (Hierarchical)
```
SUPER_ADMIN (root)
  └─ ADMIN
      └─ USER
```

### Modules
- User Management (USERS)
- Role Management (ROLES)
- Profile Management (PROFILES)
- Settings (SETTINGS)
- Audit Logs (AUDIT)

### Permissions
- CRUD (Create, Read, Update, Delete) for each module
- Export permission for Audit Logs
- **Total**: 21 permissions

### Profiles
- **ADMIN_PROFILE**: Full access to all modules (all CRUD)
- **USER_PROFILE**: Read-only access (limited)

### Mappings
- SUPER_ADMIN role → ADMIN_PROFILE
- ADMIN role → ADMIN_PROFILE
- USER role → USER_PROFILE

### Groups
- **Global Administrators** (GLOBAL_ADMINS) - cross-org capable
- **Department Managers** (DEPT_MANAGERS)

## Testing Login

```bash
# Start server
npm run dev

# Test login (use curl or Postman)
curl -X POST http://localhost:3000/rbac/login \
  -H "Content-Type: application/json" \
  -H "X-Organization-ID: 1" \
  -d '{
    "identifier": "superadmin@acme.com",
    "password": "Password@123"
  }'

# Should receive:
# - 201 status
# - User object in response
# - HTTP-only sessionId cookie set
```

## Verification Steps

After seeding, verify the following:

### 1. Database Tables Populated
```sql
SELECT COUNT(*) FROM users;        -- Should be 3
SELECT COUNT(*) FROM roles;        -- Should be 3
SELECT COUNT(*) FROM permissions;  -- Should be 21
SELECT COUNT(*) FROM groups;       -- Should be 2
```

### 2. Role Hierarchy
```sql
SELECT r1.name AS role, r2.name AS parent
FROM roles r1
LEFT JOIN roles r2 ON r1.parent_role_id = r2.id
ORDER BY r1.id;

-- Expected:
-- Super Administrator | NULL
-- Administrator | Super Administrator
-- User | Administrator
```

### 3. User Role Assignments
```sql
SELECT u.username, r.name AS role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;

-- Expected:
-- superadmin | Super Administrator
-- admin | Administrator
-- user | User
```

### 4. Profile Permissions Count
```sql
SELECT p.name, COUNT(*) AS permission_count
FROM profiles p
JOIN profile_permissions pp ON p.id = pp.profile_id
GROUP BY p.name;

-- Expected:
-- Admin Profile | 21
-- User Profile | 4 (read-only access)
```

## Troubleshooting

### Issue: "No such file or directory: bcrypt"
**Solution**: Install bcrypt
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### Issue: "relation 'organizations' does not exist"
**Solution**: Run migrations first
```bash
npx knex migrate:latest
```

### Issue: Seed fails with FK violation
**Solution**: Ensure migrations created all composite unique constraints
```bash
# Check if unique constraints exist
psql $DATABASE_URL -c "\d users"
# Should see: UNIQUE (organization_id, id)
```

## Resetting Data

To reset and re-seed:
```bash
# Rollback all migrations
npx knex migrate:rollback --all

# Re-run migrations
npx knex migrate:latest

# Re-run seeds
npx knex seed:run
```

## Production Deployment

**Before deploying to production**:
1. Change default password hash in seed file or skip seeding in production
2. Use secure, randomly generated passwords
3. Create real admin accounts through secure onboarding
4. Consider removing seed file from production bundle

**Production Seed Strategy**:
- Use seeds for development/staging only
- Bootstrap production with secure initialization script
- Or manually create first admin via direct database insert with secure password
