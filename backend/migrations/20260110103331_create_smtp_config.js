exports.up = async function (knex) {
  await knex.schema.createTable('smtp_config', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.string('name')

    table.string('host').notNullable()
    table.integer('port').notNullable()

    table.string('username')
    table.text('password')

    table.enu('encryption', ['none', 'tls', 'ssl'])

    table.string('from_email')
    table.string('from_name')
    table.string('reply_to_email')

    table.boolean('is_active').defaultTo(true)

    table.index(['organization_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('smtp_config')
}
