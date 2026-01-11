exports.up = async function(knex) {
  await knex.schema.createTable('role_profiles', (table) => {
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('role_id').unsigned().notNullable();
    table.bigInteger('profile_id').unsigned().notNullable();
    
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.bigInteger('assigned_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Primary key from schema
    table.primary(['organization_id', 'role_id', 'profile_id']);
  });
  
  // CRITICAL: Composite foreign keys (multi-tenant security)
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

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('role_profiles');
};