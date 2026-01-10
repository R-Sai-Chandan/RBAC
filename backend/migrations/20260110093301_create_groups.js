exports.up = async function (knex) {
  await knex.schema.createTable('groups', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.string('name').notNullable()
    table.text('description')

    table.boolean('is_active').defaultTo(true)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()

    table.timestamp('updated_at')
    table.bigInteger('updated_by').unsigned()

    table.unique(['organization_id', 'name'])
    table.index(['organization_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('groups')
}
