exports.up = async function(knex) {
  // Create effect enum
  await knex.raw(`
    CREATE TYPE permission_effect AS ENUM ('allow', 'deny');
  `);
  
  await knex.schema.createTable('profile_permissions', (table) => {
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('profile_id').unsigned().notNullable();
    table.bigInteger('permission_id').unsigned().notNullable();
    
    table.specificType('effect', 'permission_effect').notNullable();
    
    // Primary key from schema
    table.primary(['organization_id', 'profile_id', 'permission_id']);
  });
  
  // CRITICAL: Composite foreign keys (multi-tenant security)
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

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('profile_permissions');
  await knex.raw('DROP TYPE IF EXISTS permission_effect');
};