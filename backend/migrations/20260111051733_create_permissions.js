exports.up = async function(knex) {
  // Create permission action enum
  await knex.raw(`
    CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'export');
  `);
  
  await knex.schema.createTable('permissions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    table.bigInteger('module_id').unsigned().notNullable();
    // Removed module_name - redundant (available via FK join)
    
    table.specificType('action', 'permission_action').notNullable();
    
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    
    // Index from schema
    table.unique(['organization_id', 'module_id', 'action']);
    
    // CRITICAL: Composite unique constraint to allow composite FK references
    table.unique(['organization_id', 'id']);
  });
  
  // CRITICAL: Composite foreign key (multi-tenant security)
  await knex.raw(`
    ALTER TABLE permissions
    ADD CONSTRAINT fk_permissions_module
    FOREIGN KEY (organization_id, module_id)
    REFERENCES modules(organization_id, id)
    ON DELETE CASCADE
  `);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('permissions');
  await knex.raw('DROP TYPE IF EXISTS permission_action');
};