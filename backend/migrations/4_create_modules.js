/**
 * Migration: create_modules
 *
 * This migration strictly implements the provided `modules` schema.
 * It avoids enums, preserves multi-tenant security via proper foreign keys,
 * and documents database vs application responsibilities at the bottom.
 */

exports.up = async function (knex) {
  // === Core identifiers ===
  await knex.schema.createTable('modules', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable();

    // === Module metadata ===
    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description').nullable();

    // === Status and ordering ===
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').nullable();

    // === Unique constraints ===
    table.unique(['organization_id', 'code']);
  });

  // === Foreign key constraints ===
  await knex.schema.alterTable('modules', (table) => {
    table
      .foreign('organization_id')
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('modules');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 *
 * 1. Primary Key
 *    - modules.id
 *    - Ensures unique identification of each module.
 *
 * 2. Foreign Key
 *    - modules.organization_id → organizations.id
 *    - ON DELETE CASCADE ensures referential integrity and safe removal
 *      of modules if the parent organization is deleted.
 *
 * 3. Unique Constraint
 *    - (organization_id, code)
 *    - Guarantees that each module code is unique within its organization,
 *      preserving schema-defined uniqueness.
 *
 * 4. Not Null Constraints
 *    - organization_id, name, code, is_active
 *    - Ensures mandatory fields are always present.
 *
 * 5. Default Values
 *    - is_active defaults to true, providing a safe default state at DB level.
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 *
 * 1. Global uniqueness of code
 *    - Only uniqueness within an organization is enforced.
 *    - Enforcing global uniqueness is a business rule and should not
 *      constrain schema-defined behavior.
 *
 * 2. sort_order sequence integrity
 *    - The database cannot enforce order continuity or gaps.
 *    - This depends on application-level logic and is context-sensitive.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 *
 * 1. Validation of name and code
 *    - Length limits, allowed characters, and formatting rules
 *
 * 2. Business rules for module activation
 *    - Conditional activation/deactivation workflows
 *
 * 3. sort_order management
 *    - Ensuring correct order updates, handling conflicts, auto-reordering
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 *
 * - No enums are used to maintain flexibility and ease of migration.
 * - Foreign keys ensure referential integrity at the database level.
 * - Composite unique constraints enforce multi-tenant isolation per organization.
 * - Backend-level validations handle business rules and ordering that
 *   cannot be safely expressed in SQL.
 * - The migration strictly follows the schema while maintaining clarity,
 *   maintainability, and production-grade best practices.
 */
