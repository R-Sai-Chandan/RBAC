/**
 * Migration: create_profile_permissions
 *
 * This migration strictly implements the provided `profile_permissions` schema.
 * It avoids enums by using a CHECK constraint for `effect`, preserves
 * multi-tenant security via composite foreign keys, and documents
 * database vs application responsibilities at the bottom.
 */

exports.up = async function (knex) {
  // === Core identifiers ===
  await knex.schema.createTable('profile_permissions', (table) => {
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('profile_id').unsigned().notNullable();
    table.bigInteger('permission_id').unsigned().notNullable();

    // === Permission effect field (allow / deny) ===
    table.string('effect').notNullable();
    table.check(
      "effect IN ('allow', 'deny')",
      'profile_permissions_effect_check'
    );
  });

  // === Primary key ===
  await knex.schema.alterTable('profile_permissions', (table) => {
    table.primary(['organization_id', 'profile_id', 'permission_id']);
  });

  // === Composite foreign keys for multi-tenant isolation ===
  /**
   * Ensures that profile-permission assignments cannot cross organization boundaries.
   * Implemented via raw SQL because Knex does not fully support composite foreign keys.
   */
  await knex.raw(`
    ALTER TABLE profile_permissions
      ADD CONSTRAINT fk_profile_permissions_profile
      FOREIGN KEY (organization_id, profile_id)
      REFERENCES profiles(organization_id, id)
      ON DELETE CASCADE,
      ADD CONSTRAINT fk_profile_permissions_permission
      FOREIGN KEY (organization_id, permission_id)
      REFERENCES permissions(organization_id, id)
      ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('profile_permissions');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 *
 * 1. Primary Key
 *    - (organization_id, profile_id, permission_id)
 *    - Guarantees that a profile cannot have the same permission more than once
 *      within the same organization.
 *
 * 2. Composite Foreign Keys (Multi-Tenant Isolation)
 *    - (organization_id, profile_id) → profiles(organization_id, id)
 *    - (organization_id, permission_id) → permissions(organization_id, id)
 *    - Ensures assignments are constrained within the same organization.
 *    - Deleting a profile or permission cascades safely.
 *
 * 3. CHECK Constraint for `effect`
 *    - effect IN ('allow', 'deny')
 *    - Ensures only valid permission effects are allowed without using an enum type.
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 *
 * 1. Complex business rules
 *    - For example, preventing conflicting allow/deny rules for the same profile.
 *
 * 2. Conditional permission logic
 *    - E.g., restricting permissions to certain module types or roles.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 *
 * 1. Business logic for permission assignment
 *    - Who can assign which permissions
 *    - Conflicts between allow and deny rules
 *
 * 2. Audit and logging
 *    - Tracking changes to profile permissions beyond primary key and effect
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 *
 * - Enum replaced with a CHECK constraint to maintain DB portability.
 * - Composite primary and foreign keys ensure tenant isolation at the database level.
 * - No redundant FK to organizations is needed; multi-tenant safety is already enforced
 *   via composite FKs to profiles and permissions.
 * - Business rules that cannot be expressed in SQL are clearly documented and
 *   enforced in the backend.
 * - The migration strictly follows the schema while maintaining strong
 *   data integrity and secure multi-tenant isolation.
 */
