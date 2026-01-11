exports.up = async function(knex) {
  await knex.schema.createTable('profiles', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description');
    
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Index from schema
    table.unique(['organization_id', 'code']);
    
    // Performance indexes
    table.index('is_active');
    table.index('created_by');
    
    // CRITICAL: Composite unique constraint to allow composite FK references
    table.unique(['organization_id', 'id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('profiles');
};