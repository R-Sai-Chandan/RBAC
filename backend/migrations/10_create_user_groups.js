/**
 * Migration: create_user_groups
 *
 * Creates the 'user_groups' table to manage user memberships in groups within an organization.
 * Includes multi-tenant composite keys, assigned metadata, and referential integrity.
 */

exports.up = async function(knex) {
  // === Core identifiers ===
  await knex.schema.createTable('user_groups', (table) => {
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();
    table.bigInteger('group_id').unsigned().notNullable();

    // === Metadata / optional fields ===
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.bigInteger('assigned_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');

    // === Primary Key / Unique Constraints ===
    table.primary(['organization_id', 'user_id', 'group_id']); // composite PK for multi-tenant isolation
  });

  // === Foreign Keys (composite for multi-tenant security) ===
  await knex.raw(`
    ALTER TABLE user_groups
      ADD CONSTRAINT fk_user_groups_user
        FOREIGN KEY (organization_id, user_id)
        REFERENCES users(organization_id, id)
        ON DELETE CASCADE,
      ADD CONSTRAINT fk_user_groups_group
        FOREIGN KEY (organization_id, group_id)
        REFERENCES groups(organization_id, id)
        ON DELETE CASCADE
  `);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_groups');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: (organization_id, user_id, group_id) uniquely identifies each user-group assignment.
 * - Foreign Keys:
 *    - (organization_id, user_id) -> users(organization_id, id) (CASCADE on delete)
 *    - (organization_id, group_id) -> groups(organization_id, id) (CASCADE on delete)
 *    - assigned_by -> users.id (SET NULL on delete)
 * - NOT NULL:
 *    - organization_id, user_id, group_id
 * - Default Values:
 *    - assigned_at: current timestamp
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Business rules such as restricting a user to a maximum number of groups.
 * - Conditional assignments based on group types or user roles.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Validation of user permissions to assign users to groups.
 * - Preventing duplicate assignments beyond the database PK constraints.
 * - Triggering notifications or side effects when users are added/removed from groups.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Composite primary key ensures multi-tenant isolation: no cross-organization collisions.
 * - Composite foreign keys enforce referential integrity within the organization boundary.
 * - CASCADE on delete ensures that removing a user or group automatically cleans up related assignments.
 * - assigned_at and assigned_by provide audit metadata.
 * - Complex business rules are left to the backend for flexibility and maintainability.
 */
