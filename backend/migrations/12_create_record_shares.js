/**
 * Migration: create_record_shares
 *
 * Creates the 'record_shares' table to track which users, groups, or roles
 * have access to specific records within an organization and module.
 */

exports.up = async function(knex) {
  // === Core identifiers ===
  await knex.schema.createTable('record_shares', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    table.bigInteger('module_id').unsigned().notNullable()
      .references('id').inTable('modules').onDelete('CASCADE');
    table.bigInteger('record_id').notNullable();

    // === Metadata / optional fields ===
    table.bigInteger('shared_with_user_id').unsigned();
    table.bigInteger('shared_with_group_id').unsigned();
    table.bigInteger('shared_with_role_id').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');

    // === Indexes ===
    table.index(['organization_id', 'module_id', 'record_id']); // for fast lookup of shares
    table.index('created_by'); // performance for audit queries
  });

  // === Foreign Keys ===
  await knex.schema.alterTable('record_shares', (table) => {
    table.foreign('shared_with_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('shared_with_group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('shared_with_role_id').references('id').inTable('roles').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('record_shares');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: 'id' uniquely identifies each record share.
 * - Foreign Keys:
 *    - organization_id -> organizations.id (CASCADE on delete)
 *    - module_id -> modules.id (CASCADE on delete)
 *    - shared_with_user_id -> users.id (CASCADE on delete)
 *    - shared_with_group_id -> groups.id (CASCADE on delete)
 *    - shared_with_role_id -> roles.id (CASCADE on delete)
 *    - created_by -> users.id (SET NULL on delete)
 * - NOT NULL:
 *    - organization_id, module_id, record_id
 * - Default Values:
 *    - created_at: current timestamp
 * - Indexes:
 *    - (organization_id, module_id, record_id) for fast permission lookups
 *    - created_by for audit query performance
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Ensuring a record is shared with only one type of entity at a time (user, group, or role).
 * - Business-specific rules about share expiration, visibility, or ownership.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Validation of permissions to share records.
 * - Preventing duplicate or conflicting shares for the same record and entity.
 * - Audit logging and notifications triggered on share creation or removal.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Separate foreign keys for user, group, and role allow flexible sharing without violating referential integrity.
 * - CASCADE on delete ensures that if a user, group, role, module, or organization is removed, related shares are cleaned up automatically.
 * - Metadata columns (created_at, created_by) enable auditability.
 * - Index on (organization_id, module_id, record_id) ensures efficient querying for permission checks.
 * - Backend enforces complex rules that cannot be expressed in SQL alone.
 */
