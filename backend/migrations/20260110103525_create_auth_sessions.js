exports.up = async function (knex) {
  await knex.schema.createTable('auth_sessions', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id').unsigned().notNullable()
    table.bigInteger('user_id').unsigned().notNullable()

    table.string('ip_address')
    table.text('user_agent')

    table.timestamp('login_at').defaultTo(knex.fn.now())
    table.timestamp('logout_at')

    table.index(['organization_id', 'user_id'])
    table.index(['login_at'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('auth_sessions')
}
