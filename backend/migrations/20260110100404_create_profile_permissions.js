exports.up = async function (knex) {
  await knex.schema.createTable('profile_permissions', function (table) {
    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.bigInteger('profile_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('profiles')
      .onDelete('CASCADE')

    table.bigInteger('permission_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE')

    table.enu('effect', ['allow', 'deny']).notNullable()

    table.primary(['organization_id', 'profile_id', 'permission_id'])
    table.index(['profile_id'])
    table.index(['permission_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('profile_permissions')
}
