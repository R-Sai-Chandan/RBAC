exports.up = async function (knex) {
  await knex.schema.createTable('modules', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.string('name').notNullable()
    table.string('code').notNullable()
    table.text('description')

    table.boolean('is_active').defaultTo(true)
    table.integer('sort_order')

    table.unique(['organization_id', 'code'])
    table.index(['organization_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('modules')
}
