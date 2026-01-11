exports.up = async function(knex) {
  await knex.schema.createTable('auth_sessions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();
    
    // Enhanced fields for actual authentication
    table.string('session_token').notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_active').defaultTo(true);
    
    table.string('ip_address');
    table.text('user_agent');
    
    table.timestamp('login_at').defaultTo(knex.fn.now());
    table.timestamp('logout_at');
    
    // Indexes from schema
    table.index(['organization_id', 'user_id']);
    table.index('login_at');
    
    // Performance indexes
    table.index('session_token');
    table.index('expires_at');
  });
  
  // CRITICAL: Composite foreign key (multi-tenant security)
  await knex.raw(`
    ALTER TABLE auth_sessions
    ADD CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (organization_id, user_id)
    REFERENCES users(organization_id, id)
    ON DELETE CASCADE
  `);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('auth_sessions');
};