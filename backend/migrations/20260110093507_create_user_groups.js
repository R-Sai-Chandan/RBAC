exports.up = async function (knex) {
  await knex.schema.createTable('user_groups', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table.bigInteger('group_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('groups')
      .onDelete('CASCADE')

    table.timestamp('assigned_at').defaultTo(knex.fn.now())
    table.bigInteger('assigned_by').unsigned()

    table.unique(['organization_id', 'user_id', 'group_id'])
    table.index(['user_id'])
    table.index(['group_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_groups')
}
