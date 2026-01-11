/**
 * Migration: create_role_profiles
 *
 * This migration strictly implements the provided `role_profiles` schema.
 * It preserves multi-tenant security via composite foreign keys,
 * avoids enums, and documents database vs application responsibilities at the bottom.
 */

exports.up = async function (knex) {
  // === Core identifiers ===
  await knex.schema.createTable('role_profiles', (table) => {
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('role_id').unsigned().notNullable();
    table.bigInteger('profile_id').unsigned().notNullable();

    // === Assignment metadata ===
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.bigInteger('assigned_by').unsigned().nullable();
  });

  // === Foreign key constraints ===
  await knex.schema.alterTable('role_profiles', (table) => {
    table
      .foreign('assigned_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });

  // === Primary key ===
  await knex.schema.alterTable('role_profiles', (table) => {
    table.primary(['organization_id', 'role_id', 'profile_id']);
  });

  /**
   * CRITICAL: Composite foreign keys for multi-tenant isolation
   *
   * Ensures that role-profile assignments cannot cross organization boundaries.
   * Implemented via raw SQL because Knex does not support composite foreign keys
   * in all dialects.
   */
  await knex.raw(`
    ALTER TABLE role_profiles
      ADD CONSTRAINT fk_role_profiles_role
      FOREIGN KEY (organization_id, role_id)
      REFERENCES roles(organization_id, id)
      ON DELETE CASCADE,
      ADD CONSTRAINT fk_role_profiles_profile
      FOREIGN KEY (organization_id, profile_id)
      REFERENCES profiles(organization_id, id)
      ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('role_profiles');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 *
 * 1. Primary Key
 *    - (organization_id, role_id, profile_id)
 *    - Guarantees that a profile cannot be assigned the same role
 *      more than once within the same organization.
 *
 * 2. Composite Foreign Keys (Multi-Tenant Isolation)
 *    - (organization_id, role_id) → roles(organization_id, id)
 *    - (organization_id, profile_id) → profiles(organization_id, id)
 *    - Ensures that role-profile assignments do not cross organization boundaries.
 *    - Deleting a role or profile within an organization cascades safely.
 *
 * 3. assigned_by Referential Integrity
 *    - assigned_by → users(id) with ON DELETE SET NULL
 *    - Preserves historical audit data even if the assigning user is removed.
 *
 * 4. Defaults
 *    - assigned_at defaults to CURRENT_TIMESTAMP
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 *
 * 1. Authorization Semantics
 *    - The database ensures *integrity*, not *intent*.
 *    - Whether a role can be assigned to a profile depends on application logic.
 *
 * 2. Business workflow rules
 *    - Ensuring active roles or profiles are assigned
 *    - Conditional assignment logic
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 *
 * 1. Role assignment permissions
 *    - Who is allowed to assign or revoke role-profile assignments.
 *
 * 2. Business workflows
 *    - Onboarding, deactivation, and role/profile transitions.
 *
 * 3. Audit and logging beyond assigned_at / assigned_by
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 *
 * - Composite primary and foreign keys ensure tenant isolation at the database level.
 * - No enums are used, keeping the schema flexible and migration-safe.
 * - All schema-defined uniqueness and mandatory fields are enforced at DB level.
 * - Business rules that cannot be safely expressed in SQL are documented rather than silently ignored.
 *
 * This design strictly follows the schema while maintaining strong
 * data integrity and secure multi-tenant isolation.
 */
