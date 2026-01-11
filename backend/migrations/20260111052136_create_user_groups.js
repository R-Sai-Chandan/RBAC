exports.up = async function(knex) {
  await knex.schema.createTable('user_groups', (table) => {
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();
    table.bigInteger('group_id').unsigned().notNullable();
    
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.bigInteger('assigned_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Primary key from schema
    table.primary(['organization_id', 'user_id', 'group_id']);
  });
  
  // CRITICAL: Composite foreign keys (multi-tenant security)
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