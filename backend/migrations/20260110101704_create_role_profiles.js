exports.up = async function (knex) {
  await knex.schema.createTable('role_profiles', function (table) {
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

    table.bigInteger('profile_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('profiles')
      .onDelete('CASCADE')

    table.timestamp('assigned_at').defaultTo(knex.fn.now())
    table.bigInteger('assigned_by').unsigned()

    table.primary(['organization_id', 'role_id', 'profile_id'])
    table.index(['role_id'])
    table.index(['profile_id'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('role_profiles')
}
