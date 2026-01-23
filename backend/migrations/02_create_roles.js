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

    table.bigInteger('created_by')
      .unsigned()
      .nullable();
    // FK added via RAW for composite check

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
    FOREIGN KEY(parent_role_id, organization_id)
    REFERENCES roles(id, organization_id)
    ON DELETE SET NULL,
    ADD CONSTRAINT fk_roles_created_by
    FOREIGN KEY(organization_id, created_by)
    REFERENCES users(organization_id, id)
    ON DELETE SET NULL
    `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('roles');
};
