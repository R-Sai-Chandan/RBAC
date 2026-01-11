/**
 * Migration: create_permissions
 *
 * This migration strictly implements the provided `permissions` schema.
 * It avoids enums by using a CHECK constraint for actions, preserves
 * multi-tenant security via a composite foreign key, and documents database
 * vs application responsibilities at the bottom.
 */

exports.up = async function (knex) {
  // === Core identifiers ===
  await knex.schema.createTable('permissions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('module_id').unsigned().notNullable();

    // === Permission metadata ===
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    // === Action field as CHECK constraint (replaces enum) ===
    table.string('action').notNullable();
    table.check(
      "action IN ('create', 'read', 'update', 'delete', 'export')",
      'permissions_action_check'
    );

    // === Unique constraints ===
    table.unique(['organization_id', 'module_id', 'action']);
  });

  // === Foreign key constraints ===
  await knex.schema.alterTable('permissions', (table) => {
    table
      .foreign('organization_id')
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
  });

  /**
   * CRITICAL: Composite foreign key for multi-tenant isolation
   *
   * Ensures a permission cannot be assigned to a module outside its
   * organization. Implemented via raw SQL because Knex does not natively
   * support composite foreign keys in all dialects.
   */
  await knex.raw(`
    ALTER TABLE permissions
      ADD CONSTRAINT fk_permissions_module
      FOREIGN KEY (organization_id, module_id)
      REFERENCES modules(organization_id, id)
      ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  // Drop composite FK first
  await knex.raw(`
    ALTER TABLE permissions
      DROP CONSTRAINT IF EXISTS fk_permissions_module
  `);

  // Drop table
  await knex.schema.dropTableIfExists('permissions');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 *
 * 1. Primary Key
 *    - permissions.id
 *    - Ensures each permission record is uniquely identifiable.
 *
 * 2. Foreign Keys
 *    - organization_id → organizations.id
 *      Ensures every permission belongs to a valid organization.
 *    - Composite foreign key (organization_id, module_id) → modules(organization_id, id)
 *      Enforces multi-tenant isolation; permissions cannot reference
 *      modules outside the same organization.
 *
 * 3. Unique Constraint
 *    - (organization_id, module_id, action)
 *    - Guarantees that each action is unique per module within an organization.
 *
 * 4. Not Null Constraints
 *    - organization_id, module_id, action, is_active
 *    - Mandatory fields enforced at the database level.
 *
 * 5. CHECK Constraint (replacement for enum)
 *    - action IN ('create', 'read', 'update', 'delete', 'export')
 *    - Ensures only valid actions are allowed without using enums.
 *
 * 6. Default Values
 *    - is_active defaults to true
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 *
 * 1. module_name presence
 *    - No longer stored in the table; can always be derived via join to modules.
 *
 * 2. Business logic related to action applicability
 *    - Restricting certain actions for certain module types.
 *
 * 3. Conditional activation logic
 *    - Permissions can only be active if the module is active (application logic).
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 *
 * 1. Validation of action beyond allowed strings
 *    - Case normalization, logging, formatting
 *
 * 2. Business logic and authorization
 *    - Who can assign permissions
 *    - Interaction with module status and organization policies
 *
 * 3. Audit/logging
 *    - Tracking permission creation, updates, deletions
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 *
 * - module_name removed to eliminate redundancy and maintain normalization.
 * - Enum removed and replaced with a CHECK constraint for database portability.
 * - Composite foreign key ensures multi-tenant security and referential integrity.
 * - All schema-defined uniqueness and mandatory fields are enforced at DB level.
 * - Backend handles business logic that cannot be expressed via SQL.
 * - Migration strictly follows schema while maintaining clarity,
 *   maintainability, and production-grade best practices.
 */
