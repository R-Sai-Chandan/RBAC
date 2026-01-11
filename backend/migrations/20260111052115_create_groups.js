exports.up = async function(knex) {
  await knex.schema.createTable('groups', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.string('name').notNullable();
    table.text('description');
    
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Index from schema
    table.unique(['organization_id', 'name']);
    
    // Performance index
    table.index('created_by');
    
    // CRITICAL: Composite unique constraint to allow composite FK references
    table.unique(['organization_id', 'id']);
  });
  
  // Add FK for users.primary_group_id
  await knex.schema.alterTable('users', (table) => {
    table.foreign('primary_group_id').references('id').inTable('groups').onDelete('SET NULL');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign('primary_group_id');
  });
  await knex.schema.dropTableIfExists('groups');
};