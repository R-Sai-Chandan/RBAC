/**
 * Migration: create_smtp_config
 *
 * Creates the 'smtp_config' table for storing SMTP settings per organization.
 * Supports multiple configurations with audit metadata and encryption type enforcement.
 */

exports.up = async function(knex) {
  await knex.schema.createTable('smtp_config', (table) => {
    // === Core identifiers ===
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name').notNullable();

    // === SMTP Connection Fields ===
    table.string('host').notNullable();
    table.integer('port').notNullable();
    table.string('username');
    table.text('password');
    table.string('encryption').defaultTo('none'); // replaced enum with string + check

    // === Metadata / Optional Fields ===
    table.string('from_email').notNullable();
    table.string('from_name');
    table.string('reply_to_email');
    table.boolean('is_active').defaultTo(true);

    // === Indexes ===
    table.index('organization_id');

    // === Constraints ===
    table.check(`
      encryption IN ('none', 'tls', 'ssl')
    `, [], 'valid_smtp_encryption');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('smtp_config');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: 'id' uniquely identifies each SMTP configuration.
 * - Foreign Keys:
 *    - organization_id -> organizations.id (CASCADE on delete)
 * - NOT NULL:
 *    - organization_id, name, host, port, from_email
 * - Default Values:
 *    - encryption: 'none'
 *    - is_active: true
 * - Check Constraints:
 *    - encryption must be one of ('none', 'tls', 'ssl')
 * - Indexes:
 *    - organization_id for quick lookup of configs per organization
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Validation that SMTP credentials are correct.
 * - Ensuring the host and port combination is reachable or unique per organization.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Encrypting and decrypting passwords before storing/retrieving.
 * - Validating email formats for from_email, reply_to_email.
 * - Ensuring only one active SMTP configuration per organization at a time.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Enum removed and replaced with string + check constraint for DB-agnosticism.
 * - CASCADE on delete ensures configurations are cleaned up when an organization is removed.
 * - Index on organization_id enables fast querying of SMTP configs by organization.
 * - Backend handles validation, encryption, and business rules that cannot be enforced via SQL.
 */
