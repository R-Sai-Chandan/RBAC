/**
 * Migration: create_audit_logs
 *
 * Creates the 'audit_logs' table to track actions performed by users/roles
 * on entities within the system. Supports multi-tenant organizations and
 * enforces action and status validity via CHECK constraints.
 */

exports.up = async function(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    // === Core identifiers ===
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');

    table.bigInteger('user_id').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    table.bigInteger('role_id').unsigned()
      .references('id').inTable('roles').onDelete('SET NULL');

    table.string('action').notNullable(); // replaced enum with string + check

    // === Targeted entity ===
    table.bigInteger('module_id').unsigned()
      .references('id').inTable('modules').onDelete('SET NULL');
    table.string('entity_type');
    table.bigInteger('entity_id');

    // === Change tracking ===
    table.json('old_values');
    table.json('new_values');

    // === Metadata / optional fields ===
    table.string('ip_address');
    table.text('user_agent');
    table.string('status').notNullable(); // replaced enum with string + check
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // === Indexes ===
    table.index(['organization_id', 'created_at']);
    table.index('user_id');
    table.index('entity_type');

    // === Constraints ===
    table.check(`action IN ('create', 'update', 'delete')`, [], 'valid_audit_action');
    table.check(`status IN ('success', 'failed')`, [], 'valid_audit_status');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: 'id' uniquely identifies each audit log entry.
 * - Foreign Keys:
 *    - organization_id -> organizations.id (CASCADE on delete)
 *    - user_id -> users.id (SET NULL on delete)
 *    - role_id -> roles.id (SET NULL on delete)
 *    - module_id -> modules.id (SET NULL on delete)
 * - NOT NULL:
 *    - organization_id, action, status
 * - Default Values:
 *    - created_at: current timestamp
 * - Check Constraints:
 *    - action must be one of ('create', 'update', 'delete')
 *    - status must be one of ('success', 'failed')
 * - Indexes:
 *    - (organization_id, created_at) for multi-tenant auditing queries
 *    - user_id for user-specific audit lookups
 *    - entity_type for entity-based filtering
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Validation of old_values and new_values content and schema.
 * - Business logic determining whether an action should be logged.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Recording meaningful old/new values based on entity changes.
 * - Ensuring audit log integrity (e.g., tamper-proof, sequential ordering).
 * - Security checks for who is allowed to perform logged actions.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Enums replaced with strings + check constraints for DB-agnosticism.
 * - CASCADE/SET NULL rules maintain referential integrity without losing historical logs.
 * - Indexed columns allow efficient queries for audits by organization, user, or entity type.
 * - Backend handles complex validation, logging rules, and security enforcement.
 */
