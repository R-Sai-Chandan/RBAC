exports.up = async function (knex) {
  await knex.schema.createTable('audit_logs', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    // What was affected
    table.string('entity').notNullable() // users, roles, permissions, etc
    table.bigInteger('record_id') // nullable for non-record actions

    // What happened
    table.string('action').notNullable() // CREATE, UPDATE, DELETE, LOGIN, etc
    table.string('field_name') // only for field-level updates

    table.text('old_value')
    table.text('new_value')

    // Who did it
    table.bigInteger('actor_user_id').unsigned()
    table.bigInteger('actor_role_id').unsigned()

    // Context
    table.string('ip_address')
    table.text('user_agent')

    // Immutable timestamp
    table.timestamp('created_at').defaultTo(knex.fn.now())

    // Indexes (VERY IMPORTANT)
    table.index(['organization_id'])
    table.index(['entity', 'record_id'])
    table.index(['actor_user_id'])
    table.index(['created_at'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs')
}
