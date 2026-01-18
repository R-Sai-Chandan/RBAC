/**
 * RBAC System Seed Data
 * 
 * ARCHITECTURAL DECISION:
 * - SETTINGS is the ONLY admin module exposed in navigation
 * - USERS, ROLES, PROFILES, GROUPS, SMTP, AUDIT are sub-capabilities under SETTINGS
 * - Permissions: SETTINGS:read, SETTINGS:manage_users, SETTINGS:manage_roles, etc.
 * 
 * All passwords are hashed using bcrypt (Password@123)
 */

const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
    // ═══════════════════════════════════════════════════════════════════════
    // PART 1: Organizations
    // ═══════════════════════════════════════════════════════════════════════
    await knex('audit_logs').del();
    await knex('user_groups').del();
    await knex('groups').del();
    await knex('role_profiles').del();
    await knex('profile_permissions').del();
    await knex('profiles').del();
    await knex('permissions').del();
    await knex('modules').del();
    await knex('user_roles').del();
    await knex('roles').del();
    await knex('auth_sessions').del();
    await knex('users').del();
    await knex('organizations').del();

    const [org] = await knex('organizations').insert([
        {
            id: 1,
            name: 'Acme Corp',
            domain: 'acme.com',
            status: 'active',
            created_at: knex.fn.now()
        }
    ]).returning('*');

    console.log('✓ Organization created:', org.name);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 2: Users (with bcrypt-hashed passwords)
    // ═══════════════════════════════════════════════════════════════════════
    const passwordHash = await bcrypt.hash('Password@123', 10);

    const users = await knex('users').insert([
        {
            id: 1,
            organization_id: org.id,
            username: 'superadmin',
            email: 'superadmin@acme.com',
            password_hash: passwordHash,
            first_name: 'Super',
            last_name: 'Admin',
            status: 'active',
            default_landing_page: '/rbac/settings',
            created_at: knex.fn.now()
        },
        {
            id: 2,
            organization_id: org.id,
            username: 'admin',
            email: 'admin@acme.com',
            password_hash: passwordHash,
            first_name: 'Regular',
            last_name: 'Admin',
            status: 'active',
            default_landing_page: '/rbac/settings/users',
            created_at: knex.fn.now()
        },
        {
            id: 3,
            organization_id: org.id,
            username: 'user',
            email: 'user@acme.com',
            password_hash: passwordHash,
            first_name: 'Normal',
            last_name: 'User',
            status: 'active',
            default_landing_page: '/rbac/profile',
            created_at: knex.fn.now()
        }
    ]).returning('*');

    console.log('✓ Users created:', users.length);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 3: Roles (Hierarchical)
    // ═══════════════════════════════════════════════════════════════════════
    const roles = await knex('roles').insert([
        {
            id: 1,
            organization_id: org.id,
            name: 'Super Administrator',
            code: 'SUPER_ADMIN',
            description: 'Root role with full system access',
            parent_role_id: null,
            is_active: true,
            created_at: knex.fn.now(),
            created_by: 1
        },
        {
            id: 2,
            organization_id: org.id,
            name: 'Administrator',
            code: 'ADMIN',
            description: 'Administrative role with elevated privileges',
            parent_role_id: 1,
            is_active: true,
            created_at: knex.fn.now(),
            created_by: 1
        },
        {
            id: 3,
            organization_id: org.id,
            name: 'User',
            code: 'USER',
            description: 'Standard user role',
            parent_role_id: 2,
            is_active: true,
            created_at: knex.fn.now(),
            created_by: 1
        }
    ]).returning('*');

    console.log('✓ Roles created:', roles.length);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 4: User Role Assignments
    // ═══════════════════════════════════════════════════════════════════════
    await knex('user_roles').insert([
        { organization_id: org.id, user_id: 1, role_id: 1, assigned_at: knex.fn.now(), assigned_by: 1 },
        { organization_id: org.id, user_id: 2, role_id: 2, assigned_at: knex.fn.now(), assigned_by: 1 },
        { organization_id: org.id, user_id: 3, role_id: 3, assigned_at: knex.fn.now(), assigned_by: 1 }
    ]);

    console.log('✓ User roles assigned');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 5: Module - SETTINGS ONLY (Single Admin Entry Point)
    // ═══════════════════════════════════════════════════════════════════════
    const [settingsModule] = await knex('modules').insert([
        {
            id: 1,
            organization_id: org.id,
            name: 'Settings',
            code: 'SETTINGS',
            description: 'System settings and administration',
            is_active: true,
            sort_order: 1
        }
    ]).returning('*');

    console.log('✓ Module created: SETTINGS');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 6: Permissions (SETTINGS sub-capabilities)
    // ═══════════════════════════════════════════════════════════════════════
    const permissionActions = [
        { action: 'read', description: 'View Settings module' },
        { action: 'manage_users', description: 'Create, update, delete users' },
        { action: 'manage_roles', description: 'Create, update, delete roles' },
        { action: 'manage_profiles', description: 'Create, update, delete profiles' },
        { action: 'manage_groups', description: 'Create, update, delete groups' },
        { action: 'manage_sharing', description: 'Configure sharing rules' },
        { action: 'manage_smtp', description: 'Configure SMTP settings' },
        { action: 'view_audit', description: 'View audit logs' },
        { action: 'export_audit', description: 'Export audit logs' }
    ];

    const permissions = permissionActions.map(p => ({
        organization_id: org.id,
        module_id: settingsModule.id,
        action: p.action,
        description: p.description,
        is_active: true
    }));

    const insertedPermissions = await knex('permissions').insert(permissions).returning('*');
    console.log('✓ Permissions created:', insertedPermissions.length);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 7: Profiles
    // ═══════════════════════════════════════════════════════════════════════
    const profiles = await knex('profiles').insert([
        {
            id: 1,
            organization_id: org.id,
            name: 'Admin Profile',
            code: 'ADMIN_PROFILE',
            description: 'Full administrative access to SETTINGS',
            is_active: true,
            created_at: knex.fn.now(),
            created_by: 1
        },
        {
            id: 2,
            organization_id: org.id,
            name: 'User Profile',
            code: 'USER_PROFILE',
            description: 'Standard user access (no SETTINGS)',
            is_active: true,
            created_at: knex.fn.now(),
            created_by: 1
        }
    ]).returning('*');

    console.log('✓ Profiles created:', profiles.length);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 8: Profile Permissions
    // ═══════════════════════════════════════════════════════════════════════
    const profilePermissions = [];

    // ADMIN_PROFILE: Full access to all SETTINGS sub-capabilities
    for (const permission of insertedPermissions) {
        profilePermissions.push({
            organization_id: org.id,
            profile_id: 1, // ADMIN_PROFILE
            permission_id: permission.id,
            effect: 'allow'
        });
    }

    // USER_PROFILE: NO access to SETTINGS (deny-by-default, no entries needed)
    // Empty - no permissions for USER_PROFILE on SETTINGS

    await knex('profile_permissions').insert(profilePermissions);
    console.log('✓ Profile permissions assigned:', profilePermissions.length);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 9: Role Profile Assignments
    // ═══════════════════════════════════════════════════════════════════════
    await knex('role_profiles').insert([
        { organization_id: org.id, role_id: 1, profile_id: 1, assigned_at: knex.fn.now(), assigned_by: 1 },
        { organization_id: org.id, role_id: 2, profile_id: 1, assigned_at: knex.fn.now(), assigned_by: 1 },
        { organization_id: org.id, role_id: 3, profile_id: 2, assigned_at: knex.fn.now(), assigned_by: 1 }
    ]);

    console.log('✓ Role profiles assigned');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 10: Groups (Cross-Organization Capable)
    // ═══════════════════════════════════════════════════════════════════════
    const groups = await knex('groups').insert([
        {
            id: 1,
            organization_id: org.id,
            name: 'Global Administrators',
            code: 'GLOBAL_ADMINS',
            description: 'Cross-organization administrative group',
            is_active: true,
            created_at: knex.fn.now(),
            created_by: 1
        }
    ]).returning('*');

    console.log('✓ Groups created:', groups.length);

    // ═══════════════════════════════════════════════════════════════════════
    // PART 11: User Group Assignments
    // ═══════════════════════════════════════════════════════════════════════
    await knex('user_groups').insert([
        { organization_id: org.id, user_id: 1, group_id: 1, assigned_at: knex.fn.now(), assigned_by: 1 },
        { organization_id: org.id, user_id: 2, group_id: 1, assigned_at: knex.fn.now(), assigned_by: 1 }
    ]);

    console.log('✓ User groups assigned');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 12: Audit Logs
    // ═══════════════════════════════════════════════════════════════════════
    await knex('audit_logs').insert([
        {
            organization_id: org.id,
            user_id: 1,
            role_id: 1,
            action: 'create',
            module_id: 1,
            entity_type: 'user_role',
            entity_id: 1,
            old_values: null,
            new_values: JSON.stringify({ user_id: 1, role_id: 1 }),
            ip_address: '127.0.0.1',
            user_agent: 'Seed Script',
            status: 'success',
            created_at: knex.fn.now()
        }
    ]);

    console.log('✓ Audit logs created');

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ RBAC SEED DATA COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ARCHITECTURE: SETTINGS is the ONLY admin module');
    console.log('SUB-CAPABILITIES: manage_users, manage_roles, manage_profiles, etc.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LOGIN CREDENTIALS:');
    console.log('  superadmin@acme.com / Password@123 → Full SETTINGS access');
    console.log('  admin@acme.com / Password@123 → Full SETTINGS access');
    console.log('  user@acme.com / Password@123 → NO SETTINGS access');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};
