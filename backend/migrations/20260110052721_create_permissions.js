exports.up = async function (knex) {
  await knex.schema.createTable('permissions', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.string('resource').notNullable()
    table.string('action').notNullable()

    table.text('description')

    table.boolean('is_active').defaultTo(true)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()

    table.unique(['organization_id', 'resource', 'action'])
    table.index(['organization_id'])
    table.index(['created_by'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('permissions')
}
