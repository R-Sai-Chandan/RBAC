/**
 * Migration: create_sharing_rules
 *
 * Creates the 'sharing_rules' table to manage cross-organization sharing policies.
 * Enforces type-based validity, multi-entity references, and audit metadata.
 */

exports.up = async function(knex) {
  await knex.schema.createTable('sharing_rules', (table) => {
    // === Core identifiers ===
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');

    table.string('rule_type').notNullable(); // replaced enum with string + check

    // === Source/Target References ===
    table.bigInteger('source_user_id').unsigned();
    table.bigInteger('target_user_id').unsigned();
    table.bigInteger('source_role_id').unsigned();
    table.bigInteger('target_role_id').unsigned();
    table.bigInteger('source_group_id').unsigned();
    table.bigInteger('target_group_id').unsigned();
    table.bigInteger('module_id').unsigned()
      .references('id').inTable('modules').onDelete('CASCADE');

    // === Metadata / optional fields ===
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');

    // === Indexes ===
    table.index('created_by');

    // === Constraints ===
    table.check(`
      (rule_type = 'user_to_user' AND source_user_id IS NOT NULL AND target_user_id IS NOT NULL) OR
      (rule_type = 'role_to_role' AND source_role_id IS NOT NULL AND target_role_id IS NOT NULL) OR
      (rule_type = 'group_to_group' AND source_group_id IS NOT NULL AND target_group_id IS NOT NULL) OR
      (rule_type = 'record_level')
    `, [], 'valid_sharing_rule_type');
  });

  // === Foreign Keys ===
  await knex.schema.alterTable('sharing_rules', (table) => {
    table.foreign('source_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('target_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('source_role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('target_role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('source_group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('target_group_id').references('id').inTable('groups').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sharing_rules');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: 'id' uniquely identifies each sharing rule.
 * - Foreign Keys:
 *    - organization_id -> organizations.id (CASCADE on delete)
 *    - module_id -> modules.id (CASCADE on delete)
 *    - source_user_id / target_user_id -> users.id (CASCADE)
 *    - source_role_id / target_role_id -> roles.id (CASCADE)
 *    - source_group_id / target_group_id -> groups.id (CASCADE)
 * - NOT NULL:
 *    - organization_id, rule_type
 * - Default Values:
 *    - is_active: true
 *    - created_at: current timestamp
 * - Check Constraints:
 *    - rule_type-based validity ensures only the correct combination of source/target IDs are set.
 * - Indexes:
 *    - created_by for performance of audit lookups
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Ensuring that a rule does not conflict with existing sharing policies.
 * - Limiting rules per user, role, or group for business logic reasons.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Permissions to create, modify, or delete sharing rules.
 * - Complex cascading effects when deactivating users, roles, groups, or modules.
 * - Ensuring that rule_type semantics are respected in application logic beyond DB-level checks.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Enum removed and replaced with string + check constraint to maintain flexibility and DB-agnosticism.
 * - Check constraint enforces type-based validity at the DB level.
 * - Foreign keys enforce referential integrity with CASCADE for safe deletion.
 * - Metadata columns provide auditability (created_at, created_by, is_active).
 * - Backend layer handles more complex business rules that cannot be enforced via SQL.
 */
