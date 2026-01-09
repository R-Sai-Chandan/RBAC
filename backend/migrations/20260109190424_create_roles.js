exports.up = async function (knex) {
  await knex.schema.createTable('roles', function (table) {
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

    table.bigInteger('parent_role_id').unsigned()
      .references('id')
      .inTable('roles')
      .onDelete('SET NULL')

    table.boolean('is_active').defaultTo(true)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()

    table.unique(['organization_id', 'code'])
    table.index(['organization_id'])
    table.index(['parent_role_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('roles')
}
