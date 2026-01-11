/**
 * Migration: create_auth_sessions
 *
 * Creates the 'auth_sessions' table to track user login sessions.
 * Includes multi-tenant composite foreign key for security and indexing for fast lookups.
 */

exports.up = async function(knex) {
  // === Core identifiers ===
  await knex.schema.createTable('auth_sessions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('organization_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();

    // === Metadata / optional fields ===
    table.string('ip_address');
    table.text('user_agent');
    table.timestamp('login_at').defaultTo(knex.fn.now());
    table.timestamp('logout_at');

    // === Indexes ===
    table.index(['organization_id', 'user_id']);
    table.index('login_at');
  });

  // === Foreign Key ===
  await knex.raw(`
    ALTER TABLE auth_sessions
    ADD CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (organization_id, user_id)
    REFERENCES users(organization_id, id)
    ON DELETE CASCADE
  `);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('auth_sessions');
};

/**
 * =====================================================================
 * DATABASE-LEVEL CONSTRAINTS AND RULES (ENFORCED HERE)
 * =====================================================================
 * - Primary Key: 'id' uniquely identifies each session.
 * - Foreign Key:
 *    - (organization_id, user_id) -> users(organization_id, id) (CASCADE on delete)
 * - NOT NULL:
 *    - organization_id, user_id
 * - Indexes:
 *    - (organization_id, user_id) for multi-tenant session lookup
 *    - login_at for efficient login history queries
 *
 * =====================================================================
 * RULES THAT CANNOT OR SHOULD NOT BE ENFORCED AT THE DATABASE LEVEL
 * =====================================================================
 * - Session expiration logic and automatic cleanup of old sessions.
 * - Limiting concurrent sessions per user.
 *
 * =====================================================================
 * RULES THAT MUST BE ENFORCED IN THE BACKEND / APPLICATION LAYER
 * =====================================================================
 * - Authentication token validation and session management.
 * - Updating logout_at timestamp on session termination.
 * - Security checks like IP restrictions or device recognition.
 *
 * =====================================================================
 * DESIGN JUSTIFICATION
 * =====================================================================
 * - Composite foreign key ensures multi-tenant isolation and prevents cross-organization session leakage.
 * - Indexed columns enable fast queries for auditing or session validation.
 * - Backend handles session lifecycle and security rules that cannot be enforced at the SQL level.
 */
