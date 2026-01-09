const db = require('./db')

async function test() {
  const result = await db.one('SELECT 1 as ok')
  console.log(result)
  process.exit(0)
}

test().catch(err => {
  console.error('DB connection failed:', err)
  process.exit(1)
})
