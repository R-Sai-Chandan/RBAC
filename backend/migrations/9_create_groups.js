/**
 * Migration: create_groups
 *
 * Creates the 'groups' table for organizing user groups within organizations.
 * Includes core identifiers, metadata fields, unique constraints, and foreign keys.
 */

exports.up = async function (knex) {
  // === Core identifiers ===
  await knex.schema.createTable('groups', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');

    // === Metadata / optional fields ===
    table.string('name').notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');

    // === Primary Key / Unique Constraints ===
    table.unique(['organization_id', 'name']); // unique group name within organization
    table.unique(['organization_id', 'id']);   // supports composite FK / multi-tenant isolation

    // === Indexes ===
    table.index('created_by'); // performance for created_by lookups
  });

  // === Foreign Keys for relationships outside this table ===
  await knex.schema.alterTable('users', (table) => {
    table.foreign('primary_group_id')
      .references('id').inTable('groups')
      .onDelete('SET NULL');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign('primary_group_id');
  });
  await knex.schema.dropTableIfExists('groups');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: 'id' uniquely identifies each group.
 * - Unique Constraints:
 *    - ('organization_id', 'name'): ensures no duplicate group names per organization.
 *    - ('organization_id', 'id'): supports multi-tenant composite key scenarios.
 * - Foreign Keys:
 *    - 'organization_id' -> organizations.id (CASCADE on delete)
 *    - 'created_by' -> users.id (SET NULL on delete)
 *    - 'users.primary_group_id' -> groups.id (SET NULL on delete)
 * - NOT NULL:
 *    - organization_id, name
 * - Default Values:
 *    - is_active: true
 *    - created_at: current timestamp
 * - Indexes:
 *    - 'created_by' for performance of lookup queries
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Enforcing business rules such as only one active group per user or complex organizational hierarchies.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Validation of user permissions to create or modify groups.
 * - Ensuring group name conventions or length restrictions beyond the database column limits.
 * - Business logic involving deactivation/reactivation of groups or cascading effects on users.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Composite unique constraint ('organization_id', 'id') added to facilitate multi-tenant FKs.
 * - Separate unique constraint ('organization_id', 'name') enforces human-readable uniqueness per organization.
 * - Foreign keys use CASCADE / SET NULL to ensure referential integrity without blocking deletions.
 * - Metadata fields (created_at, created_by, is_active) provide auditability and logical deletion flags.
 * - All constraints enforceable at the DB level are included; more complex business logic is left to the application layer.
 */
