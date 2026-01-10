const db = require('./db')

async function test() {
  const orgs = await db.any('SELECT id, gstin FROM organizations')
  const users = await db.any('SELECT id, code FROM roles')
  const permissions = await db.any('SELECT organization_id, action, resource FROM permissions')

  console.log({ orgs, users, permissions })
  process.exit(0)
}

test().catch(console.error)

  