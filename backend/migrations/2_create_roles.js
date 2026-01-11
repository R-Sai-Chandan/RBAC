/**
 * Roles table migration
 *
 * Hierarchical roles per organization
 * - Supports nullable parent_role_id (root roles)
 * - Enforces same-organization parent relationships
 */

exports.up = async function (knex) {
  await knex.schema.createTable('roles', (table) => {
    /* ---------------- Primary Key ---------------- */

    table.bigIncrements('id').primary();

    /* ---------------- Organization ---------------- */

    table
      .bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');

    /* ---------------- Role Data ---------------- */

    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description');

    /* ---------------- Hierarchy ---------------- */

    // Nullable: allows root-level roles
    table.bigInteger('parent_role_id').unsigned().nullable();

    /* ---------------- Status ---------------- */

    table.boolean('is_active').notNullable().defaultTo(true);

    /* ---------------- Audit ---------------- */

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table
      .bigInteger('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    /* ---------------- Indexes ---------------- */

    // Enforce unique role code per organization
    table.unique(['organization_id', 'code']);

    table.index('organization_id');
    table.index('parent_role_id');

    /*
      REQUIRED for composite FK:
      Allows (parent_role_id, organization_id) to reference roles
    */
    table.unique(['id', 'organization_id']);

    /* ---------------- Checks ---------------- */

    // Prevent self-parenting (NULL allowed)
    table.check(
      '?? IS NULL OR ?? <> ??',
      ['parent_role_id', 'parent_role_id', 'id']
    );
  });

  /* ------------------------------------------------
     Composite Foreign Key
     Enforces:
     - parent_role_id exists
     - parent role belongs to SAME organization
     ------------------------------------------------ */
  await knex.raw(`
    ALTER TABLE roles
    ADD CONSTRAINT fk_roles_parent_same_org
    FOREIGN KEY (parent_role_id, organization_id)
    REFERENCES roles(id, organization_id)
    ON DELETE SET NULL
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('roles');
};

/* =====================================================================
   DOCUMENTATION & DESIGN NOTES
   =====================================================================

   DATABASE-LEVEL ENFORCED RULES
   -----------------------------
   1. A role belongs to exactly one organization
      - Enforced via organization_id FK

   2. Role codes are unique per organization
      - UNIQUE (organization_id, code)

   3. parent_role_id is OPTIONAL
      - Nullable column
      - Allows root-level roles

   4. Parent role must belong to SAME organization
      - Composite FK:
        (parent_role_id, organization_id)
        → roles(id, organization_id)

   5. Parent role cannot be itself
      - CHECK (parent_role_id IS NULL OR parent_role_id <> id)

   6. Deleting a parent role does NOT delete children
      - ON DELETE SET NULL


   RULES THAT CANNOT BE SAFELY ENFORCED IN DB
   ------------------------------------------
   These rules exist but are NOT enforced at DB level
   because standard SQL constraints cannot express them
   reliably or performantly.

   1. No circular references (strict tree)
      Example:
        A → B → C → A

      WHY NOT DB:
      - Requires recursive traversal
      - CHECK constraints cannot reference recursive state
      - Triggers are complex, error-prone, and slow

      RECOMMENDED:
      - Enforce in backend service layer
      - Before insert/update:
          - Run recursive query to verify parent is not a descendant

   2. Maximum tree depth (if needed in future)
      - Not defined in schema
      - Must be handled in backend if introduced


   BACKEND ENFORCEMENT (RECOMMENDED)
   ---------------------------------
   The backend SHOULD enforce:

   - Prevent circular role hierarchies
   - Validate parent_role_id belongs to same organization
     (DB enforces this too — backend validation improves UX)
   - Prevent reassignment that would introduce cycles

   Example backend flow:
   1. Fetch ancestors of parent_role_id using recursive query
   2. Reject if current role id appears in ancestor chain
   3. Proceed with insert/update


   SUMMARY
   -------
   ✔ All schema-defined constraints are enforced in DB
   ✔ Nullable parent_role_id fully supported
   ✔ Composite FK guarantees organization isolation
   ✔ Complex hierarchy rules correctly delegated to backend

   This design is safe, scalable, and production-grade.
   ===================================================================== */
