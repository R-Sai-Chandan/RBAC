exports.up = async function(knex) {
  await knex.raw(`
    CREATE TYPE smtp_encryption AS ENUM ('none', 'tls', 'ssl');
  `);
  
  await knex.schema.createTable('smtp_config', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.string('name').notNullable();
    
    table.string('host').notNullable();
    table.integer('port').notNullable();
    
    table.string('username');
    table.text('password');
    
    table.specificType('encryption', 'smtp_encryption').defaultTo('none');
    
    table.string('from_email').notNullable();
    table.string('from_name');
    table.string('reply_to_email');
    
    table.boolean('is_active').defaultTo(true);
    
    // Index from schema
    table.index('organization_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('smtp_config');
  await knex.raw('DROP TYPE IF EXISTS smtp_encryption');
};