/**
 * RBAC System Seed Data
 *
 * COMPLIANCE NOTE:
 * This seed strictly adheres to the database schema defined in migrations.
 *
 * SCHEMA CONSTRAINTS & RESOLUTION:
 * 1. Organizations: Requires `company_name`, `address`, `gstin`, etc. (Added)
 * 2. Permissions: 'action' is restricted to ('create', 'read', 'update', 'delete', 'export').
 *    - To support granular access (e.g. manage users vs manage roles), we MUST create separate
 *      DB Modules ('Users', 'Roles', etc.) instead of a single 'Settings' module.
 *    - This allows unique `read`, `create` actions per resource type.
 *    - 'Settings' is kept as a logical grouping concept or dashboard module.
 */

const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
    // ─────────────────────────────────────────────────────────────
    // 1. CLEANUP (Order is critical due to FKs)
    // ─────────────────────────────────────────────────────────────
    // Use a helper to ignore 'table does not exist' if fresh
    const clean = async (table) => knex(table).del();

    await clean('audit_logs');
    await clean('user_groups');
    await clean('user_roles');
    await clean('role_profiles');
    await clean('profile_permissions');
    await clean('permissions');
    await clean('profiles');
    await clean('groups');
    await clean('modules');
    await clean('roles');

    // Organization and User circular dependency handling:
    // We delete users first, then orgs.
    // But created_by FKs might lock.
    // Best practice: Update FKs to null, then delete.
    await knex('users').update({ reports_to_user_id: null, created_by: null, updated_by: null });
    await knex('organizations').update({ created_by: null });

    await clean('users');
    await clean('organizations');

    console.log('✓ Cleanup complete');

    // ─────────────────────────────────────────────────────────────
    // 2. ORGANIZATION
    // ─────────────────────────────────────────────────────────────
    const [org] = await knex('organizations')
        .insert({
            company_name: 'Acme Corp', // Changed from name to company_name
            // Required Address Fields
            address: '123 Enterprise Blvd',
            city: 'Metropolis',
            state: 'NY',
            postal_code: '10001',
            country: 'USA',
            // Required Tax/Legal
            gstin: 'URP', // Unregistered Person or valid ID
            // Optional/Defaults
            financial_year_start_month: 4,
            created_at: knex.fn.now()
        })
        .returning('*');

    console.log('✓ Organization created:', org.company_name);

    // ─────────────────────────────────────────────────────────────
    // 3. USERS
    // ─────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Password@123', 10);

    const users = await knex('users')
        .insert([
            {

                organization_id: org.id,
                username: 'superadmin',
                password_hash: passwordHash,
                status: 'active',
                first_name: 'Super',
                last_name: 'Admin',
                primary_email: 'superadmin@acme.com',
                office_phone: '555-0101', // Required
                default_landing_page: '/rbac/settings',
                created_at: knex.fn.now()
            },
            {

                organization_id: org.id,
                username: 'admin',
                password_hash: passwordHash,
                status: 'active',
                first_name: 'Regular',
                last_name: 'Admin',
                primary_email: 'admin@acme.com',
                office_phone: '555-0102',
                default_landing_page: '/rbac/settings/users',
                created_at: knex.fn.now()
            },
            {

                organization_id: org.id,
                username: 'user',
                password_hash: passwordHash,
                status: 'active',
                first_name: 'Normal',
                last_name: 'User',
                primary_email: 'user@acme.com',
                office_phone: '555-0103',
                default_landing_page: '/rbac/profile',
                created_at: knex.fn.now()
            }
        ])
        .returning('*');

    // Link Organization Creator (Circular Fix)
    await knex('organizations').update({ created_by: users[0].id }).where({ id: org.id });
    // Link Users Creator
    await knex('users').update({ created_by: users[0].id }).whereIn('id', [1, 2, 3]);

    console.log('✓ Users created');

    // ─────────────────────────────────────────────────────────────
    // 4. ROLES
    // ─────────────────────────────────────────────────────────────
    await knex('roles').insert([
        {

            organization_id: org.id,
            name: 'Super Admin',
            code: 'SUPER_ADMIN',
            description: 'System Root',
            parent_role_id: null,
            is_active: true,
            created_by: users[0].id
        },
        {

            organization_id: org.id,
            name: 'Administrator',
            code: 'ADMIN',
            description: 'Organization Admin',
            parent_role_id: 1,
            is_active: true,
            created_by: users[0].id
        },
        {

            organization_id: org.id,
            name: 'User',
            code: 'USER',
            description: 'Standard User',
            parent_role_id: 2,
            is_active: true,
            created_by: users[0].id
        }
    ]);

    console.log('✓ Roles created');

    await knex('user_roles').insert([
        { organization_id: org.id, user_id: 1, role_id: 1, assigned_by: users[0].id },
        { organization_id: org.id, user_id: 2, role_id: 2, assigned_by: users[0].id },
        { organization_id: org.id, user_id: 3, role_id: 3, assigned_by: users[0].id }
    ]);

    // ─────────────────────────────────────────────────────────────
    // 5. MODULES (Granular resources for Permission granularity)
    // ─────────────────────────────────────────────────────────────
    const modulesList = [
        { name: 'Users', code: 'USERS', description: 'User Management' },
        { name: 'Roles', code: 'ROLES', description: 'Role Management' },
        { name: 'Profiles', code: 'PROFILES', description: 'Profile Management' },
        { name: 'Groups', code: 'GROUPS', description: 'Group Management' },
        { name: 'Sharing Rules', code: 'SHARING', description: 'Record Sharing Configuration' },
        { name: 'Audit Logs', code: 'AUDIT', description: 'System Audit Logs' },
        { name: 'SMTP Config', code: 'SMTP_CONFIG', description: 'Email Server Configuration' }
    ];

    const modules = await knex('modules')
        .insert(
            modulesList.map(m => ({
                ...m,
                organization_id: org.id,
                is_active: true
            }))
        )
        .returning('*');

    console.log('✓ Modules created');

    // ─────────────────────────────────────────────────────────────
    // 6. PERMISSIONS
    // ─────────────────────────────────────────────────────────────
    // Standard Actions: create, read, update, delete, export
    const allActions = ['create', 'read', 'update', 'delete', 'export'];
    const viewOnly = ['read', 'export'];
    const readOnly = ['read'];

    const permissionInserts = [];

    // Helper to map modules to actions
    const getModId = (code) => modules.find(m => m.code === code).id;

    // Define Policy:

    // Users: Full CRUD
    allActions.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('USERS'), action, is_active: true }));

    // Roles: Full CRUD
    allActions.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('ROLES'), action, is_active: true }));

    // Profiles: Full CRUD
    allActions.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('PROFILES'), action, is_active: true }));

    // Groups: Full CRUD
    allActions.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('GROUPS'), action, is_active: true }));

    // Sharing: Full CRUD
    allActions.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('SHARING'), action, is_active: true }));

    // Audit: View/Export Only (Audit logs are immutable)
    viewOnly.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('AUDIT'), action, is_active: true }));

    // SMTP: Full CRUD
    allActions.forEach(action => permissionInserts.push({ organization_id: org.id, module_id: getModId('SMTP_CONFIG'), action, is_active: true }));

    const permissions = await knex('permissions').insert(permissionInserts).returning('*');

    console.log('✓ Permissions created:', permissions.length);

    // ─────────────────────────────────────────────────────────────
    // 7. PROFILES
    // ─────────────────────────────────────────────────────────────
    await knex('profiles').insert([
        { organization_id: org.id, name: 'Admin Profile', code: 'ADMIN_PROFILE', is_active: true, created_by: users[0].id },
        { organization_id: org.id, name: 'Standard Profile', code: 'USER_PROFILE', is_active: true, created_by: users[0].id }
    ]);

    // ─────────────────────────────────────────────────────────────
    // 8. PROFILE ↔ PERMISSIONS
    // ─────────────────────────────────────────────────────────────

    // ADMIN_PROFILE: Get EVERYTHING
    const adminPerms = permissions.map(p => ({
        organization_id: org.id,
        profile_id: 1,
        permission_id: p.id,
        effect: 'allow'
    }));

    // USER_PROFILE: Minimal Access (e.g. Read Users, Read Settings?)
    // For safety, start empty (deny all). User can assign later.

    await knex('profile_permissions').insert(adminPerms);

    console.log('✓ Profile permissions assigned');

    // Link Roles to Profiles
    await knex('role_profiles').insert([
        { organization_id: org.id, role_id: 1, profile_id: 1, assigned_by: users[0].id }, // Super -> Admin
        { organization_id: org.id, role_id: 2, profile_id: 1, assigned_by: users[0].id }, // Admin -> Admin
        { organization_id: org.id, role_id: 3, profile_id: 2, assigned_by: users[0].id }  // User -> User
    ]);

    // ─────────────────────────────────────────────────────────────
    // 9. GROUPS
    // ─────────────────────────────────────────────────────────────
    await knex('groups').insert([
        { organization_id: org.id, name: 'All Users', is_active: true, created_by: users[0].id }
    ]);

    await knex('user_groups').insert([
        { organization_id: org.id, user_id: 1, group_id: 1, assigned_by: users[0].id },
        { organization_id: org.id, user_id: 2, group_id: 1, assigned_by: users[0].id },
        { organization_id: org.id, user_id: 3, group_id: 1, assigned_by: users[0].id }
    ]);

    console.log('✓ Seed Complete');
};
