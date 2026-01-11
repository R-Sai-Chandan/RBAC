exports.up = async function(knex) {
  await knex.schema.createTable('record_shares', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.bigInteger('module_id').unsigned().notNullable()
      .references('id').inTable('modules').onDelete('CASCADE');
    table.bigInteger('record_id').notNullable();
    
    table.bigInteger('shared_with_user_id').unsigned();
    table.bigInteger('shared_with_group_id').unsigned();
    table.bigInteger('shared_with_role_id').unsigned();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Index from schema
    table.index(['organization_id', 'module_id', 'record_id']);
    
    // Performance index
    table.index('created_by');
  });
  
  await knex.schema.alterTable('record_shares', (table) => {
    table.foreign('shared_with_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('shared_with_group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('shared_with_role_id').references('id').inTable('roles').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('record_shares');
};
