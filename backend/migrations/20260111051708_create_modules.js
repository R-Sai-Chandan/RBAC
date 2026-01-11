exports.up = async function(knex) {
  await knex.schema.createTable('modules', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description');
    
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order');
    
    // Index from schema
    table.unique(['organization_id', 'code']);
    
    // CRITICAL: Composite unique constraint to allow composite FK references
    table.unique(['organization_id', 'id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('modules');
};
