exports.up = async function (knex) {
  await knex.schema.createTable('role_permissions', function (table) {
    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.bigInteger('role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE')

    table.bigInteger('permission_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE')

    table.boolean('is_allowed').defaultTo(true)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()

    table.primary(['organization_id', 'role_id', 'permission_id'])
    table.index(['organization_id', 'role_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('role_permissions')
}
