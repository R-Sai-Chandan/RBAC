exports.up = async function(knex) {
  // Create sharing rule type enum
  await knex.raw(`
    CREATE TYPE sharing_rule_type AS ENUM ('user_to_user', 'role_to_role', 'group_to_group', 'record_level');
  `);
  
  await knex.schema.createTable('sharing_rules', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    
    table.specificType('rule_type', 'sharing_rule_type').notNullable();
    
    table.bigInteger('source_user_id').unsigned();
    table.bigInteger('target_user_id').unsigned();
    
    table.bigInteger('source_role_id').unsigned();
    table.bigInteger('target_role_id').unsigned();
    
    table.bigInteger('source_group_id').unsigned();
    table.bigInteger('target_group_id').unsigned();
    
    table.bigInteger('module_id').unsigned()
      .references('id').inTable('modules').onDelete('CASCADE');
    
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Performance index
    table.index('created_by');
    
    // Check constraint from schema: rule_type based validity
    table.check(`
      (rule_type = 'user_to_user' AND source_user_id IS NOT NULL AND target_user_id IS NOT NULL) OR
      (rule_type = 'role_to_role' AND source_role_id IS NOT NULL AND target_role_id IS NOT NULL) OR
      (rule_type = 'group_to_group' AND source_group_id IS NOT NULL AND target_group_id IS NOT NULL) OR
      (rule_type = 'record_level')
    `, [], 'valid_sharing_rule_type');
  });
  
  // Add foreign keys for users, roles, groups
  await knex.schema.alterTable('sharing_rules', (table) => {
    table.foreign('source_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('target_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('source_role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('target_role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('source_group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('target_group_id').references('id').inTable('groups').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sharing_rules');
  await knex.raw('DROP TYPE IF EXISTS sharing_rule_type');
};