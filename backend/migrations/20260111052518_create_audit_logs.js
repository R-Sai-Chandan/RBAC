exports.up = async function(knex) {
  await knex.raw(`
    CREATE TYPE audit_action AS ENUM ('create', 'delete', 'update');
    CREATE TYPE audit_status AS ENUM ('success', 'failed');
  `);
  
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.bigInteger('user_id').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    table.bigInteger('role_id').unsigned()
      .references('id').inTable('roles').onDelete('SET NULL');
    
    table.specificType('action', 'audit_action').notNullable();
    
    table.bigInteger('module_id').unsigned()
      .references('id').inTable('modules').onDelete('SET NULL');
    
    table.string('entity_type');
    table.bigInteger('entity_id');
    
    table.json('old_values');
    table.json('new_values');
    
    table.string('ip_address');
    table.text('user_agent');
    
    table.specificType('status', 'audit_status').notNullable();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Index from schema
    table.index(['organization_id', 'created_at']);
    
    // Performance indexes
    table.index('user_id');
    table.index('entity_type');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.raw(`
    DROP TYPE IF EXISTS audit_action;
    DROP TYPE IF EXISTS audit_status;
  `);
};