exports.up = async function(knex) {
  await knex.schema.createTable('organizations', function(table) {
    table.bigIncrements('id').primary()
    table.string('company_name').notNullable()
    table.text('company_logo')
    table.text('address')
    table.string('city')
    table.string('state')
    table.string('postal_code')
    table.string('country')
    table.string('phone')
    table.string('fax')
    table.string('website')
    table.string('facebook')
    table.string('twitter')
    table.string('linkedin')
    table.integer('financial_year_start_month').checkBetween([1, 12])
    table.string('gstin').notNullable()
    table.boolean('is_active').defaultTo(true)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned() // will reference users.id later
    table.timestamp('updated_at')

    table.index('company_name')
  })

  
  // Create users table
  await knex.schema.createTable('users', function(table) {
    table.bigIncrements('id').primary()
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE')

    table.string('username').notNullable()
    table.text('password_hash').notNullable()
    table.enu('status', ['active', 'inactive', 'deleted']).defaultTo('active')

    table.string('first_name')
    table.string('last_name').notNullable()
    table.string('title')
    table.string('department')

    table.bigInteger('reports_to_user_id').unsigned()
    table.bigInteger('primary_group_id').unsigned()

    table.string('primary_email').notNullable()
    table.string('secondary_email')
    table.string('other_email')

    table.string('office_phone')
    table.string('mobile_phone')
    table.string('home_phone')
    table.string('secondary_phone')
    table.string('fax')

    table.text('street')
    table.string('city')
    table.string('state')
    table.string('country')
    table.string('postal_code')

    table.string('timezone')
    table.json('business_hours')

    table.string('default_landing_page')
    table.string('default_record_view')
    table.string('name_format')
    table.string('phone_country_code')
    table.boolean('full_screen_preview')

    table.string('preferred_currency')
    table.string('digit_grouping_pattern')
    table.string('decimal_separator')
    table.integer('decimal_precision')
    table.enu('symbol_placement', ['before', 'after'])
    table.enu('trailing_zero_handling', ['show', 'hide'])
    table.string('aggregation_format')

    table.text('signature')

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.bigInteger('created_by').unsigned()
    table.timestamp('updated_at')
    table.bigInteger('updated_by').unsigned()

    table.timestamp('last_login_at')
    table.timestamp('password_changed_at')

    // Unique & other indexes
    table.unique(['organization_id', 'username'])
    table.index('organization_id')
    table.index('primary_email')
  })
}

exports.down =async function(knex) {
  await knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('organizations')
}
