exports.up = async function (knex) {

  // ================================
  // ORGANIZATIONS TABLE
  // ================================
  await knex.schema.createTable('organizations', (table) => {
    table.bigIncrements('id').primary();

    table.string('company_name').notNullable();
    table.text('company_logo');

    table.text('address').notNullable();
    table.string('city').notNullable();
    table.string('state').notNullable();
    table.string('postal_code').notNullable();
    table.string('country').notNullable();

    table.string('phone');
    table.string('fax');
    table.string('website');

    table.string('facebook');
    table.string('twitter');
    table.string('linkedin');

    table
      .integer('financial_year_start_month')
      .checkBetween([1, 12]);

    table.string('gstin').notNullable();

    //table.boolean('is_active').defaultTo(true);

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned();
    table.timestamp('updated_at');

    table.index('company_name');
  });
  
   // ================================
  // USERS TABLE
  // ================================
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();

    table.bigInteger('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');

    table.string('username').notNullable();
    table.text('password_hash').notNullable();

    // ENUM → CHECK
    table
      .string('status')
      .notNullable()
      .defaultTo('active')
      .checkIn(['active', 'inactive', 'deleted']);

    table.string('first_name');
    table.string('last_name').notNullable();
    table.string('title');
    table.string('department');

    table.bigInteger('reports_to_user_id').unsigned();
    table.bigInteger('primary_group_id').unsigned();

    table.string('primary_email').notNullable();
    table.string('secondary_email');
    table.string('other_email');

    table.string('office_phone').notNullable();
    table.string('mobile_phone');
    table.string('home_phone');
    table.string('secondary_phone');
    table.string('fax');

    table.text('street');
    table.string('city');
    table.string('state');
    table.string('country');
    table.string('postal_code');

    table.string('timezone');
    table.json('business_hours');

    table.string('default_landing_page');
    table.string('default_record_view');
    table.string('name_format');
    table.string('phone_country_code');
    table.boolean('full_screen_preview');

    table.string('preferred_currency');
    table.string('digit_grouping_pattern');
    table.string('decimal_separator');
    table.integer('decimal_precision');

    // ENUM → CHECK
    table
      .string('symbol_placement')
      .checkIn(['before', 'after']);

    table
      .string('trailing_zero_handling')
      .checkIn(['show', 'hide']);

    table.string('aggregation_format');

    table.text('signature');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.bigInteger('created_by').unsigned();
    table.timestamp('updated_at');
    table.bigInteger('updated_by').unsigned();

    table.timestamp('last_login_at');
    table.timestamp('password_changed_at');



    // Indexes and Unique Constraints
    table.unique(['organization_id', 'username']);
    table.unique(['organization_id', 'primary_email']);
    table.unique(['organization_id', 'id']); // composite FK safety
    table.index('organization_id');
    table.index('primary_email');
    table.index('status');
    table.index('created_by');
  });

  // ================================
  // SELF-REFERENCING FK (users)
  // ================================
  await knex.schema.alterTable('users', (table) => {
    table
      .foreign('reports_to_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });

  // ================================
  // CIRCULAR FK (organizations → users)
  // ================================
  await knex.schema.alterTable('organizations', (table) => {
    table
      .foreign('created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });
};

exports.down = async function (knex) {

  await knex.schema.alterTable('organizations', (table) => {
    table.dropForeign('created_by');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropForeign('organization_id');
    table.dropForeign('reports_to_user_id');
  });

  await knex.schema.dropTableIfExists('organizations');
  await knex.schema.dropTableIfExists('users');
};