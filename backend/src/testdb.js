const db = require('./db')

async function test() {
  const orgs = await db.any('SELECT id, gstin FROM organizations')
  const users = await db.any('SELECT id, code FROM roles')

  console.log({ orgs, users })
  process.exit(0)
}

test().catch(console.error)

  