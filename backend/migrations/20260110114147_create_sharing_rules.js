exports.up = async function (knex) {
  await knex.schema.createTable('sharing_rules', function (table) {
    table.bigIncrements('id').primary()

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    table.enu('rule_type', [
      'user_to_user',
      'role_to_role',
      'group_to_group',
      'record_level'
    ]).notNullable()

    // user based
    table.bigInteger('source_user_id').unsigned()
    table.bigInteger('target_user_id').unsigned()

    // role based
    table.bigInteger('source_role_id').unsigned()
    table.bigInteger('target_role_id').unsigned()

    // group based
    table.bigInteger('source_group_id').unsigned()
    table.bigInteger('target_group_id').unsigned()

    table.bigInteger('module_id').unsigned()

    table.boolean('is_active').defaultTo(true)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()

    table.index(['organization_id'])
    table.index(['rule_type'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sharing_rules')
}
