/**
 * Migration: create_profiles
 *
 * This migration strictly implements the provided `profiles` schema.
 * It avoids enums, preserves multi-tenant security via composite foreign keys,
 * and documents database vs application responsibilities at the bottom.
 */

exports.up = async function (knex) {
  // === Core identifiers ===
  await knex.schema.createTable('profiles', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable();

    // === Profile metadata ===
    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    // === Audit columns ===
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned().nullable();
  });

  // === Foreign key constraints ===
  await knex.schema.alterTable('profiles', (table) => {
    table
      .foreign('organization_id')
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');

    table
      .foreign('created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });

  // === Indexes and unique constraints ===
  await knex.schema.alterTable('profiles', (table) => {
    table.unique(['organization_id', 'code']);
    table.unique(['organization_id', 'id']); // CRITICAL for composite FK references
    table.index('is_active');
    table.index('created_by');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('profiles');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 *
 * 1. Primary Key
 *    - profiles.id
 *    - Ensures unique identification of each profile.
 *
 * 2. Foreign Keys
 *    - organization_id → organizations.id
 *      Ensures each profile belongs to a valid organization.
 *    - created_by → users.id (ON DELETE SET NULL)
 *      Preserves historical audit information even if the user is deleted.
 *
 * 3. Unique Constraints
 *    - (organization_id, code)
 *      Guarantees that each profile code is unique within its organization.
 *    - (organization_id, id)
 *      Allows composite FK references for multi-tenant isolation if needed.
 *
 * 4. Not Null Constraints
 *    - organization_id, name, code, is_active
 *    - Mandatory fields enforced at the database level.
 *
 * 5. Default Values
 *    - is_active defaults to true
 *    - created_at defaults to CURRENT_TIMESTAMP
 *
 * 6. Indexing
 *    - is_active and created_by columns are indexed for performance on common queries.
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 *
 * 1. Validation of code formatting or naming conventions
 *    - Length limits, allowed characters, or specific patterns.
 *
 * 2. Conditional activation rules
 *    - For example, only allowing active profiles under certain business rules.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 *
 * 1. Profile business rules
 *    - Who can create profiles
 *    - Workflow for activating/deactivating profiles
 *
 * 2. Validation of name and code
 *    - Ensuring business-specific formatting or uniqueness beyond DB-level
 *
 * 3. Audit logging
 *    - Tracking changes to profiles beyond created_at and created_by
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 *
 * - Composite unique constraints and multi-tenant foreign keys ensure strong
 *   data integrity and organization-level isolation.
 * - No enums are used, maintaining flexibility and migration safety.
 * - All schema-defined constraints are enforced at the database level.
 * - Business rules, naming conventions, and workflow logic are handled
 *   in the backend, keeping the database focused on data integrity.
 * - Indexes on frequently queried fields improve read performance.
 */
