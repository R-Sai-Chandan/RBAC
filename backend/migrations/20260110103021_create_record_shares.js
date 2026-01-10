exports.up = async function (knex) {
  await knex.schema.createTable('record_shares', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.bigInteger('module_id').unsigned()
    table.bigInteger('record_id').notNullable()

    table.bigInteger('shared_with_user_id').unsigned()
    table.bigInteger('shared_with_group_id').unsigned()
    table.bigInteger('shared_with_role_id').unsigned()

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()

    table.index(['organization_id', 'module_id', 'record_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('record_shares')
}
